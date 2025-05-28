import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface AIAnalysisResult {
  functionalities: DetectedFunctionality[]
  userFlows: UserFlow[]
  testScenarios: TestScenario[]
  businessLogic: BusinessLogic[]
}

export interface DetectedFunctionality {
  id: string
  name: string
  description: string
  type: "authentication" | "crud" | "form" | "navigation" | "payment" | "search" | "dashboard" | "other"
  confidence: number
  userStories: string[]
  acceptanceCriteria: string[]
  components: string[]
  routes: string[]
  apiEndpoints: string[]
  selectors: string[]
  interactions: AIInteraction[]
}

export interface UserFlow {
  id: string
  name: string
  description: string
  steps: FlowStep[]
  startPage: string
  endPage: string
  userType: string
}

export interface FlowStep {
  action: string
  element: string
  expectedResult: string
  selector: string
}

export interface TestScenario {
  id: string
  name: string
  type: "happy_path" | "edge_case" | "error_handling" | "validation" | "security"
  description: string
  preconditions: string[]
  steps: string[]
  expectedResults: string[]
  priority: "high" | "medium" | "low"
}

export interface BusinessLogic {
  feature: string
  rules: string[]
  validations: string[]
  errorCases: string[]
}

export interface AIInteraction {
  type: "click" | "input" | "select" | "upload" | "drag" | "hover" | "scroll"
  element: string
  selector: string
  description: string
  validation?: string
}

export async function analyzeCodeWithAI(
  files: Array<{ path: string; content: string }>,
  packageJson: any,
): Promise<AIAnalysisResult> {
  try {
    console.log(`Analyzing ${files.length} files with AI...`)

    // Analyze the codebase structure and content
    const codeAnalysis = await analyzeCodeStructure(files, packageJson)

    // Generate comprehensive functionality analysis with retry logic
    let functionalityAnalysis: DetectedFunctionality[] = []
    try {
      functionalityAnalysis = await analyzeFunctionalities(files)
    } catch (error) {
      console.error("Functionality analysis failed, using fallback:", error)
      functionalityAnalysis = createFallbackFunctionalities(files)
    }

    // Identify user flows and journeys with error handling
    let userFlowAnalysis: UserFlow[] = []
    try {
      userFlowAnalysis = await analyzeUserFlows(files)
    } catch (error) {
      console.error("User flow analysis failed:", error)
      userFlowAnalysis = []
    }

    // Generate test scenarios with error handling
    let testScenarios: TestScenario[] = []
    try {
      testScenarios = await generateTestScenarios(functionalityAnalysis, userFlowAnalysis)
    } catch (error) {
      console.error("Test scenario generation failed:", error)
      testScenarios = createFallbackTestScenarios(functionalityAnalysis)
    }

    // Analyze business logic with error handling
    let businessLogic: BusinessLogic[] = []
    try {
      businessLogic = await analyzeBusinessLogic(files)
    } catch (error) {
      console.error("Business logic analysis failed:", error)
      businessLogic = []
    }

    return {
      functionalities: functionalityAnalysis,
      userFlows: userFlowAnalysis,
      testScenarios: testScenarios,
      businessLogic: businessLogic,
    }
  } catch (error) {
    console.error("AI analysis error:", error)
    // Return fallback analysis instead of throwing
    return createFallbackAnalysis(files)
  }
}

function createFallbackAnalysis(files: Array<{ path: string; content: string }>): AIAnalysisResult {
  const functionalities = createFallbackFunctionalities(files)
  const testScenarios = createFallbackTestScenarios(functionalities)

  return {
    functionalities,
    userFlows: [],
    testScenarios,
    businessLogic: [],
  }
}

function createFallbackFunctionalities(files: Array<{ path: string; content: string }>): DetectedFunctionality[] {
  const functionalities: DetectedFunctionality[] = []

  // Analyze files for common patterns
  const hasAuth = files.some(
    (f) =>
      f.path.includes("login") ||
      f.path.includes("auth") ||
      f.content.toLowerCase().includes("login") ||
      f.content.toLowerCase().includes("signin"),
  )

  const hasForm = files.some(
    (f) => f.content.includes("<form") || f.content.includes("onSubmit") || f.content.includes("handleSubmit"),
  )

  const hasDashboard = files.some((f) => f.path.includes("dashboard") || f.content.toLowerCase().includes("dashboard"))

  if (hasAuth) {
    functionalities.push({
      id: "authentication",
      name: "User Authentication",
      description: "User login and authentication functionality",
      type: "authentication",
      confidence: 0.7,
      userStories: ["As a user, I want to log into the application"],
      acceptanceCriteria: ["User can enter credentials", "User is authenticated successfully"],
      components: [],
      routes: ["/login"],
      apiEndpoints: ["/api/auth"],
      selectors: ["#email", "#password", "[type='submit']", ".login-form"],
      interactions: [
        {
          type: "input",
          element: "Email field",
          selector: "#email",
          description: "User enters email address",
        },
        {
          type: "input",
          element: "Password field",
          selector: "#password",
          description: "User enters password",
        },
        {
          type: "click",
          element: "Login button",
          selector: "[type='submit']",
          description: "User clicks login button",
        },
      ],
    })
  }

  if (hasForm) {
    functionalities.push({
      id: "form-functionality",
      name: "Form Functionality",
      description: "Form submission and validation",
      type: "form",
      confidence: 0.6,
      userStories: ["As a user, I want to submit forms with validation"],
      acceptanceCriteria: ["Form validates input", "Form submits successfully", "Error messages are shown"],
      components: [],
      routes: ["/"],
      apiEndpoints: ["/api/submit"],
      selectors: ["form", "input", "button[type='submit']", ".error-message"],
      interactions: [
        {
          type: "input",
          element: "Form fields",
          selector: "input",
          description: "User fills form fields",
        },
        {
          type: "click",
          element: "Submit button",
          selector: "button[type='submit']",
          description: "User submits form",
        },
      ],
    })
  }

  if (hasDashboard) {
    functionalities.push({
      id: "dashboard",
      name: "User Dashboard",
      description: "Main user interface and dashboard functionality",
      type: "dashboard",
      confidence: 0.6,
      userStories: ["As a user, I want to view my dashboard"],
      acceptanceCriteria: ["Dashboard loads successfully", "User data is displayed"],
      components: [],
      routes: ["/dashboard"],
      apiEndpoints: ["/api/dashboard"],
      selectors: [".dashboard", "#main-content", ".user-info"],
      interactions: [],
    })
  }

  // If no specific patterns found, create a generic functionality
  if (functionalities.length === 0) {
    functionalities.push({
      id: "general-functionality",
      name: "General Application Functionality",
      description: "Basic application functionality",
      type: "other",
      confidence: 0.4,
      userStories: ["As a user, I want to use the application"],
      acceptanceCriteria: ["Application loads", "Basic navigation works"],
      components: [],
      routes: ["/"],
      apiEndpoints: [],
      selectors: ["body", "main", ".container"],
      interactions: [],
    })
  }

  return functionalities
}

function createFallbackTestScenarios(functionalities: DetectedFunctionality[]): TestScenario[] {
  const scenarios: TestScenario[] = []

  for (const func of functionalities) {
    scenarios.push({
      id: `${func.id}-happy-path`,
      name: `${func.name} - Happy Path`,
      type: "happy_path",
      description: `Test successful ${func.name.toLowerCase()}`,
      preconditions: ["Application is running", "User has access"],
      steps: ["Navigate to the page", "Interact with the functionality", "Verify success"],
      expectedResults: ["Functionality works as expected", "No errors are displayed", "User achieves their goal"],
      priority: "high",
    })

    if (func.type === "form" || func.type === "authentication") {
      scenarios.push({
        id: `${func.id}-validation`,
        name: `${func.name} - Validation`,
        type: "validation",
        description: `Test validation for ${func.name.toLowerCase()}`,
        preconditions: ["Application is running"],
        steps: ["Navigate to the page", "Submit without required fields", "Verify validation messages"],
        expectedResults: ["Validation errors are shown", "Form does not submit", "User is guided to fix errors"],
        priority: "medium",
      })
    }
  }

  return scenarios
}

async function analyzeCodeStructure(files: Array<{ path: string; content: string }>, packageJson: any) {
  try {
    const codeContext = files
      .slice(0, 3)
      .map((f) => `File: ${f.path}\n${f.content.slice(0, 1000)}`)
      .join("\n\n")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert software architect. Analyze the provided codebase briefly.`,
      prompt: `Analyze this codebase and provide insights about:

1. Application type and purpose
2. Main features and functionalities
3. Key user interactions

Package.json dependencies: ${JSON.stringify(packageJson?.dependencies || {}, null, 2)}

Code files (first 3):
${codeContext}

Provide a brief structured analysis.`,
    })

    return text
  } catch (error) {
    console.error("Code structure analysis failed:", error)
    return "Basic web application with standard functionality"
  }
}

async function analyzeFunctionalities(
  files: Array<{ path: string; content: string }>,
): Promise<DetectedFunctionality[]> {
  const functionalities: DetectedFunctionality[] = []

  // Group files by functionality (pages, components, etc.)
  const pageFiles = files
    .filter((f) => f.path.includes("/pages/") || f.path.includes("/app/") || f.path.match(/page\.(tsx?|jsx?)$/))
    .slice(0, 3) // Limit to avoid token limits

  for (const file of pageFiles) {
    try {
      const functionality = await analyzeSingleFunctionality(file, files)
      if (functionality) {
        functionalities.push(functionality)
      }
    } catch (error) {
      console.error(`Error analyzing ${file.path}:`, error)
      // Continue with other files
    }
  }

  return functionalities.length > 0 ? functionalities : createFallbackFunctionalities(files)
}

async function analyzeSingleFunctionality(
  file: { path: string; content: string },
  allFiles: Array<{ path: string; content: string }>,
): Promise<DetectedFunctionality | null> {
  try {
    // Find related files (limit to avoid token limits)
    const relatedFiles = findRelatedFiles(file, allFiles).slice(0, 2)
    const context = [file, ...relatedFiles].map((f) => `${f.path}:\n${f.content.slice(0, 1500)}`).join("\n\n")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert QA engineer. Analyze React/Next.js code to identify user functionalities. Return only valid JSON.`,
      prompt: `Analyze this code and identify the main user functionality:

${context.slice(0, 6000)}

Return a JSON object with this structure:
{
  "id": "unique-functionality-id",
  "name": "User-friendly functionality name",
  "description": "What users can accomplish",
  "type": "authentication|crud|form|navigation|payment|search|dashboard|other",
  "confidence": 0.95,
  "userStories": ["As a user, I want to..."],
  "acceptanceCriteria": ["Given..., When..., Then..."],
  "components": ["ComponentName1"],
  "routes": ["/path"],
  "apiEndpoints": ["/api/endpoint"],
  "selectors": ["#element-id", ".class-name"],
  "interactions": [
    {
      "type": "input",
      "element": "Email field",
      "selector": "#email",
      "description": "User enters email"
    }
  ]
}

Only return valid JSON. If no clear functionality, return null.`,
    })

    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      const result = JSON.parse(cleanedText)

      if (result && result.id) {
        return result as DetectedFunctionality
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
    }
  } catch (error) {
    console.error("Single functionality analysis failed:", error)
  }

  return null
}

async function analyzeUserFlows(files: Array<{ path: string; content: string }>): Promise<UserFlow[]> {
  try {
    const routingFiles = files
      .filter(
        (f) =>
          f.path.includes("layout") ||
          f.path.includes("navigation") ||
          f.content.includes("useRouter") ||
          f.content.includes("Link"),
      )
      .slice(0, 2) // Limit files

    if (routingFiles.length === 0) return []

    const context = routingFiles.map((f) => `${f.path}:\n${f.content.slice(0, 1000)}`).join("\n\n")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a UX researcher. Analyze navigation patterns to identify user flows. Return only valid JSON.`,
      prompt: `Analyze the navigation patterns to identify user flows:

${context}

Return a JSON array of user flows:
[
  {
    "id": "user-registration-flow",
    "name": "User Registration Process",
    "description": "Complete flow for new user signup",
    "steps": [
      {
        "action": "Click signup button",
        "element": "Signup button",
        "expectedResult": "Navigate to registration form",
        "selector": "#signup-btn"
      }
    ],
    "startPage": "/",
    "endPage": "/dashboard",
    "userType": "anonymous"
  }
]

Only return valid JSON array.`,
    })

    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      return JSON.parse(cleanedText) as UserFlow[]
    } catch (parseError) {
      console.error("Failed to parse user flows:", parseError)
      return []
    }
  } catch (error) {
    console.error("User flow analysis failed:", error)
    return []
  }
}

async function generateTestScenarios(
  functionalities: DetectedFunctionality[],
  userFlows: UserFlow[],
): Promise<TestScenario[]> {
  try {
    const context = {
      functionalities: functionalities.slice(0, 3), // Limit context size
      userFlows: userFlows.slice(0, 2),
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a senior QA engineer. Generate realistic test scenarios. Return only valid JSON.`,
      prompt: `Generate test scenarios based on:

Functionalities: ${JSON.stringify(context.functionalities, null, 2)}

Generate test scenarios covering happy paths, edge cases, and validation.

Return a JSON array:
[
  {
    "id": "login-happy-path",
    "name": "Successful User Login",
    "type": "happy_path",
    "description": "User successfully logs in",
    "preconditions": ["User account exists"],
    "steps": ["Enter email", "Enter password", "Click login"],
    "expectedResults": ["User is redirected", "Welcome message shown"],
    "priority": "high"
  }
]

Only return valid JSON array.`,
    })

    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      return JSON.parse(cleanedText) as TestScenario[]
    } catch (parseError) {
      console.error("Failed to parse test scenarios:", parseError)
      return createFallbackTestScenarios(functionalities)
    }
  } catch (error) {
    console.error("Test scenario generation failed:", error)
    return createFallbackTestScenarios(functionalities)
  }
}

async function analyzeBusinessLogic(files: Array<{ path: string; content: string }>): Promise<BusinessLogic[]> {
  try {
    const logicFiles = files
      .filter(
        (f) =>
          f.path.includes("/api/") ||
          f.path.includes("/lib/") ||
          f.content.includes("validation") ||
          f.content.includes("schema"),
      )
      .slice(0, 2) // Limit files

    if (logicFiles.length === 0) return []

    const context = logicFiles.map((f) => `${f.path}:\n${f.content.slice(0, 800)}`).join("\n\n")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a business analyst. Analyze code for business rules. Return only valid JSON.`,
      prompt: `Analyze the business logic and validation rules:

${context}

Return a JSON array:
[
  {
    "feature": "User Registration",
    "rules": ["Email must be unique"],
    "validations": ["Email format validation"],
    "errorCases": ["Duplicate email error"]
  }
]

Only return valid JSON array.`,
    })

    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
      return JSON.parse(cleanedText) as BusinessLogic[]
    } catch (parseError) {
      console.error("Failed to parse business logic:", parseError)
      return []
    }
  } catch (error) {
    console.error("Business logic analysis failed:", error)
    return []
  }
}

function findRelatedFiles(
  mainFile: { path: string; content: string },
  allFiles: Array<{ path: string; content: string }>,
): Array<{ path: string; content: string }> {
  const related: Array<{ path: string; content: string }> = []

  // Extract import statements from main file
  const imports = extractImports(mainFile.content)

  // Find files that are imported
  for (const importPath of imports.slice(0, 3)) {
    // Limit imports
    const relatedFile = allFiles.find(
      (f) =>
        f.path.includes(importPath) ||
        f.path.endsWith(`${importPath}.tsx`) ||
        f.path.endsWith(`${importPath}.ts`) ||
        f.path.endsWith(`${importPath}.jsx`) ||
        f.path.endsWith(`${importPath}.js`),
    )

    if (relatedFile && related.length < 2) {
      // Limit to avoid too much context
      related.push(relatedFile)
    }
  }

  return related
}

function extractImports(content: string): string[] {
  const importRegex = /import.*from\s+['"]([^'"]+)['"]/g
  const imports: string[] = []
  let match

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    if (importPath.startsWith("./") || importPath.startsWith("../")) {
      imports.push(importPath.replace(/^\.\/|^\.\.\//, ""))
    }
  }

  return imports.slice(0, 5) // Limit imports
}
