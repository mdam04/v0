import type { Functionality, FormField, Interaction } from "./repository-analyzer"

export interface TestData {
  functionality: string
  testFile: string
  setupCommands: string[]
  headlessCommand: string
  headedCommand: string
  testCode: string
  dependencies: string[]
  preconditions: string[]
  configFiles: ConfigFile[]
}

export interface ConfigFile {
  name: string
  content: string
  description: string
}

export async function generateCypressTest(functionality: Functionality, context?: string): Promise<TestData> {
  const testFile = `cypress/e2e/${functionality.id}.cy.js`

  const testData: TestData = {
    functionality: functionality.name,
    testFile,
    setupCommands: ["npm install cypress --save-dev", "npx cypress open"],
    headlessCommand: `npx cypress run --spec "${testFile}"`,
    headedCommand: `npx cypress open --e2e --spec "${testFile}"`,
    testCode: generateTestCode(functionality),
    dependencies: ["cypress", "@testing-library/cypress"],
    preconditions: generatePreconditions(functionality),
    configFiles: generateConfigFiles(functionality),
  }

  return testData
}

function generateTestCode(functionality: Functionality): string {
  const testSuites = generateTestSuites(functionality)

  return `describe('${functionality.name} Tests', () => {
  beforeEach(() => {
    // Setup: Visit the application
    cy.visit('${getBaseUrl(functionality)}')
    ${generateSetupCode(functionality)}
  })

${testSuites.join("\n\n")}

  afterEach(() => {
    // Cleanup: Reset application state
    cy.clearLocalStorage()
    cy.clearCookies()
  })
})`
}

function generateTestSuites(functionality: Functionality): string[] {
  const suites: string[] = []

  // Main functionality test
  suites.push(generateMainFunctionalityTest(functionality))

  // Form validation tests (if applicable)
  if (functionality.formFields.length > 0) {
    suites.push(generateFormValidationTest(functionality))
  }

  // Navigation tests
  if (functionality.interactions.some((i) => i.type === "navigation")) {
    suites.push(generateNavigationTest(functionality))
  }

  // Accessibility tests
  suites.push(generateAccessibilityTest(functionality))

  return suites
}

function generateMainFunctionalityTest(functionality: Functionality): string {
  const interactions = generateInteractionSteps(functionality.interactions)
  const assertions = generateAssertions(functionality)

  return `  it('should ${functionality.description.toLowerCase()}', () => {
    // Verify page elements are visible
${functionality.selectors
  .slice(0, 5)
  .map((selector) => `    cy.get('${selector}').should('be.visible')`)
  .join("\n")}

    // Execute main functionality
${interactions}

    // Verify success state
${assertions}
  })`
}

function generateFormValidationTest(functionality: Functionality): string {
  const requiredFields = functionality.formFields.filter((field) => field.required)
  const submitButton = functionality.selectors.find((s) => s.includes("button")) || 'button[type="submit"]'

  return `  it('should validate form fields', () => {
    // Test required field validation
${requiredFields
  .map(
    (field) => `    cy.get('${field.selector}').clear()
    cy.get('${submitButton}').click()
    cy.get('${field.selector}').should('have.class', 'error').or('have.attr', 'aria-invalid', 'true')`,
  )
  .join("\n")}

    // Test valid form submission
${functionality.formFields.map((field) => generateFieldInput(field)).join("\n")}
    cy.get('${submitButton}').click()
    
    // Verify successful submission
    cy.url().should('not.contain', 'error')
  })`
}

function generateNavigationTest(functionality: Functionality): string {
  const navInteractions = functionality.interactions.filter((i) => i.type === "navigation")

  return `  it('should handle navigation correctly', () => {
${navInteractions
  .map(
    (interaction) => `    // ${interaction.description}
    cy.get('${interaction.selector}').click()
    cy.url().should('include', '${extractRouteFromSelector(interaction.selector)}')`,
  )
  .join("\n")}
  })`
}

function generateAccessibilityTest(functionality: Functionality): string {
  return `  it('should be accessible', () => {
    // Check for proper heading structure
    cy.get('h1, h2, h3, h4, h5, h6').should('exist')
    
    // Check for alt text on images
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt')
    })
    
    // Check for form labels
${functionality.formFields
  .map(
    (field) => `    cy.get('${field.selector}').should('have.attr', 'aria-label').or('have.attr', 'id').then((id) => {
      if (id) cy.get(\`label[for="\${id}"]\`).should('exist')
    })`,
  )
  .join("\n")}
    
    // Check keyboard navigation
    cy.get('body').tab()
    cy.focused().should('be.visible')
  })`
}

function generateInteractionSteps(interactions: Interaction[]): string {
  return interactions
    .map((interaction) => {
      switch (interaction.type) {
        case "click":
          return `    // ${interaction.description}
    cy.get('${interaction.selector}').click()`
        case "input":
          return `    // ${interaction.description}
    cy.get('${interaction.selector}').type('test data')`
        case "submit":
          return `    // ${interaction.description}
    cy.get('${interaction.selector}').submit()`
        case "navigation":
          return `    // ${interaction.description}
    cy.get('${interaction.selector}').click()`
        default:
          return `    // ${interaction.description}
    cy.get('${interaction.selector}').click()`
      }
    })
    .join("\n")
}

function generateFieldInput(field: FormField): string {
  let testValue = "test data"

  switch (field.type) {
    case "email":
      testValue = "test@example.com"
      break
    case "password":
      testValue = "password123"
      break
    case "number":
      testValue = "123"
      break
    case "tel":
      testValue = "555-0123"
      break
    case "url":
      testValue = "https://example.com"
      break
    case "date":
      testValue = "2024-01-01"
      break
  }

  return `    cy.get('${field.selector}').type('${testValue}')`
}

function generateAssertions(functionality: Functionality): string {
  const assertions = []

  // Success URL assertion
  if (functionality.id.includes("login")) {
    assertions.push("    cy.url().should('include', '/dashboard')")
  } else if (functionality.id.includes("signup")) {
    assertions.push("    cy.url().should('include', '/welcome')")
  } else {
    assertions.push("    cy.url().should('not.contain', '/error')")
  }

  // Success message assertion
  assertions.push("    cy.get('[data-testid=\"success-message\"], .success, .alert-success').should('be.visible')")

  return assertions.join("\n")
}

function generateSetupCode(functionality: Functionality): string {
  const setup = []

  // Authentication setup if needed
  if (!functionality.id.includes("login") && !functionality.id.includes("signup")) {
    setup.push("    // Login if required for this functionality")
    setup.push("    cy.login('test@example.com', 'password123')")
  }

  return setup.join("\n")
}

function generatePreconditions(functionality: Functionality): string[] {
  const preconditions = ["Application server running on localhost:3000", "Test database seeded with sample data"]

  if (!functionality.id.includes("login") && !functionality.id.includes("signup")) {
    preconditions.push("User account: test@example.com / password123")
  }

  if (functionality.id.includes("checkout")) {
    preconditions.push("Test payment gateway configured")
    preconditions.push("Sample products available in catalog")
  }

  return preconditions
}

function generateConfigFiles(functionality: Functionality): ConfigFile[] {
  const configs: ConfigFile[] = []

  // Cypress config
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
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})`,
    description: "Main Cypress configuration file",
  })

  // Support commands
  configs.push({
    name: "cypress/support/commands.js",
    content: `// Custom commands for ${functionality.name}

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email"], #email, input[type="email"]').type(email)
  cy.get('[data-testid="password"], #password, input[type="password"]').type(password)
  cy.get('[data-testid="login-button"], #login-button, button[type="submit"]').click()
  cy.url().should('not.include', '/login')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout"], .logout, #logout').click()
  cy.url().should('include', '/login')
})

// Add custom assertions
Cypress.Commands.add('shouldBeAccessible', () => {
  cy.get('body').should('have.attr', 'role').or('have.descendants', '[role]')
})`,
    description: "Custom Cypress commands and utilities",
  })

  return configs
}

function getBaseUrl(functionality: Functionality): string {
  if (functionality.routes.length > 0) {
    return functionality.routes[0]
  }
  return "/"
}

function extractRouteFromSelector(selector: string): string {
  const hrefMatch = selector.match(/href="([^"]+)"/)
  if (hrefMatch) {
    return hrefMatch[1]
  }
  return "/"
}
