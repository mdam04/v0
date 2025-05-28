import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { EnhancedFunctionality } from "./enhanced-repository-analyzer"

export interface EnhancedTestData {
  functionality: string
  testFile: string
  setupCommands: string[]
  headlessCommand: string
  headedCommand: string
  testCode: string
  dependencies: string[]
  preconditions: string[]
  configFiles: ConfigFile[]
  scenarios: TestScenario[]
  userStories: string[]
  businessRules: string[]
}

export interface ConfigFile {
  name: string
  content: string
  description: string
}

export interface TestScenario {
  name: string
  type: "happy_path" | "edge_case" | "error_handling" | "validation" | "security"
  description: string
  steps: string[]
  assertions: string[]
}

export async function generateEnhancedCypressTest(
  functionality: EnhancedFunctionality,
  context?: string,
): Promise<EnhancedTestData> {
  try {
    console.log(`Generating enhanced tests for ${functionality.name}`)

    // Generate comprehensive test scenarios using AI
    const testScenarios = await generateTestScenariosWithAI(functionality)

    // Generate the main test code
    const testCode = await generateTestCodeWithAI(functionality, testScenarios)

    const testFile = `cypress/e2e/${functionality.id}.cy.js`

    return {
      functionality: functionality.name,
      testFile,
      setupCommands: [
        "npm install cypress --save-dev",
        "npm install @testing-library/cypress --save-dev",
        "npx cypress open",
      ],
      headlessCommand: `npx cypress run --spec "${testFile}"`,
      headedCommand: `npx cypress open --e2e --spec "${testFile}"`,
      testCode,
      dependencies: ["cypress", "@testing-library/cypress", "cypress-axe"],
      preconditions: generatePreconditions(functionality),
      configFiles: generateConfigFiles(functionality),
      scenarios: testScenarios,
      userStories: functionality.userStories,
      businessRules: functionality.businessRules,
    }
  } catch (error) {
    console.error("Enhanced test generation error:", error)
    throw new Error("Failed to generate enhanced tests")
  }
}

async function generateTestScenariosWithAI(functionality: EnhancedFunctionality): Promise<TestScenario[]> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are a senior QA engineer creating comprehensive test scenarios for web applications. Generate realistic, thorough test cases that cover all aspects of the functionality.`,
    prompt: `Generate comprehensive test scenarios for this functionality:

Name: ${functionality.name}
Description: ${functionality.description}
Type: ${functionality.type}
User Stories: ${JSON.stringify(functionality.userStories)}
Acceptance Criteria: ${JSON.stringify(functionality.acceptanceCriteria)}
Selectors: ${JSON.stringify(functionality.selectors)}
Interactions: ${JSON.stringify(functionality.interactions)}

Generate test scenarios covering:
1. Happy path (normal user behavior)
2. Edge cases (boundary conditions, unusual inputs)
3. Error handling (network failures, invalid data)
4. Validation testing (form validation, data constraints)
5. Security testing (unauthorized access, XSS prevention)

Return a JSON array of test scenarios:
[
  {
    "name": "Successful user login with valid credentials",
    "type": "happy_path",
    "description": "User successfully logs in with correct email and password",
    "steps": [
      "Navigate to login page",
      "Enter valid email address",
      "Enter correct password",
      "Click login button"
    ],
    "assertions": [
      "User is redirected to dashboard",
      "Welcome message is displayed",
      "User session is established",
      "Navigation menu shows user options"
    ]
  }
]

Generate 5-8 comprehensive scenarios. Only return valid JSON.`,
  })

  try {
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
    return JSON.parse(cleanedText) as TestScenario[]
  } catch (error) {
    console.error("Failed to parse test scenarios:", error)
    return []
  }
}

async function generateTestCodeWithAI(
  functionality: EnhancedFunctionality,
  scenarios: TestScenario[],
): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are an expert Cypress test automation engineer. Generate production-ready Cypress test code that follows best practices and covers all scenarios comprehensively.`,
    prompt: `Generate comprehensive Cypress test code for this functionality:

Functionality: ${functionality.name}
Description: ${functionality.description}
Selectors: ${JSON.stringify(functionality.selectors)}
Routes: ${JSON.stringify(functionality.routes)}
API Endpoints: ${JSON.stringify(functionality.apiEndpoints)}

Test Scenarios: ${JSON.stringify(scenarios, null, 2)}

Generate Cypress test code that:
1. Follows Cypress best practices
2. Uses proper selectors and waits
3. Includes comprehensive assertions
4. Handles async operations correctly
5. Includes accessibility testing
6. Has proper setup and teardown
7. Uses custom commands where appropriate
8. Includes error handling

Structure the test with:
- Proper describe/it blocks
- beforeEach setup
- afterEach cleanup
- Data-driven tests where applicable
- Page Object Model patterns
- Proper error handling

Return only the Cypress test code, no explanations.`,
  })

  return text.replace(/```javascript\n?|\n?```/g, "").trim()
}

function generatePreconditions(functionality: EnhancedFunctionality): string[] {
  const preconditions = [
    "Application server running on localhost:3000",
    "Test database seeded with sample data",
    "All required environment variables configured",
  ]

  // Add specific preconditions based on functionality type
  switch (functionality.type) {
    case "authentication":
      preconditions.push("Test user accounts available")
      break
    case "payment":
      preconditions.push("Test payment gateway configured")
      preconditions.push("Test credit card data available")
      break
    case "crud":
      preconditions.push("Database with test records")
      preconditions.push("Proper user permissions configured")
      break
    case "search":
      preconditions.push("Search index populated with test data")
      break
  }

  // Add preconditions based on user stories
  if (functionality.userStories.some((story) => story.includes("admin"))) {
    preconditions.push("Admin user account available")
  }

  return preconditions
}

function generateConfigFiles(functionality: EnhancedFunctionality): ConfigFile[] {
  const configs: ConfigFile[] = []

  // Enhanced Cypress config
  configs.push({
    name: "cypress.config.js",
    content: `const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Accessibility testing
      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })
      return config
    },
  },
})`,
    description: "Enhanced Cypress configuration with retries and timeouts",
  })

  // Enhanced support commands
  configs.push({
    name: "cypress/support/commands.js",
    content: `// Enhanced commands for ${functionality.name}
import 'cypress-axe'

// Authentication commands
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-testid="email"], #email, input[type="email"]').type(email)
    cy.get('[data-testid="password"], #password, input[type="password"]').type(password)
    cy.get('[data-testid="login-button"], #login-button, button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Data management commands
Cypress.Commands.add('seedTestData', () => {
  cy.request('POST', '/api/test/seed', {})
})

Cypress.Commands.add('cleanupTestData', () => {
  cy.request('DELETE', '/api/test/cleanup', {})
})

// Accessibility testing
Cypress.Commands.add('checkA11y', (selector = null) => {
  cy.injectAxe()
  cy.checkA11y(selector, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true }
    }
  })
})

// Form testing utilities
Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(field => {
    cy.get(\`[name="\${field}"], #\${field}, [data-testid="\${field}"]\`)
      .clear()
      .type(formData[field])
  })
})

// Wait for API calls
Cypress.Commands.add('waitForApi', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204])
  })
})

// Custom assertions
Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible').and('not.be.disabled')
})`,
    description: "Enhanced Cypress commands with accessibility and API testing",
  })

  return configs
}
