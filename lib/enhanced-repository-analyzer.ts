import { Octokit } from "@octokit/rest"
import { analyzeCodeWithAI, type AIAnalysisResult } from "./ai-analyzer"
import { extractSelectors } from "./selector-extractor"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export interface EnhancedFunctionality {
  id: string
  name: string
  description: string
  type: string
  confidence: number
  userStories: string[]
  acceptanceCriteria: string[]
  components: string[]
  files: string[]
  apiEndpoints: string[]
  selectors: string[]
  routes: string[]
  interactions: any[]
  testScenarios: any[]
  businessRules: string[]
}

export interface EnhancedAnalysisResult {
  repoUrl: string
  owner: string
  repo: string
  structure: any
  aiAnalysis: AIAnalysisResult
  functionalities: EnhancedFunctionality[]
  userFlows: any[]
  testScenarios: any[]
  analyzedAt: string
}

export async function analyzeRepositoryWithAI(owner: string, repo: string): Promise<EnhancedAnalysisResult> {
  try {
    console.log(`Starting AI-powered analysis of ${owner}/${repo}`)

    // First, check if repository exists and is accessible
    try {
      await octokit.rest.repos.get({ owner, repo })
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or is private`)
      } else if (error.status === 403) {
        throw new Error(
          `Access denied to repository ${owner}/${repo}. Check if it's public or if you have proper permissions.`,
        )
      }
      throw error
    }

    // Get repository structure
    let contents
    try {
      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: "",
      })
      contents = response.data
    } catch (error: any) {
      console.error("Error fetching repository contents:", error)
      throw new Error(`Failed to fetch repository contents: ${error.message}`)
    }

    // Analyze project structure
    const structure = await analyzeProjectStructure(owner, repo, contents)
    console.log(`Found ${structure.pages.length} pages and ${structure.components.length} components`)

    // Fetch file contents for AI analysis (with limits to avoid timeouts)
    const fileContents = await fetchFileContents(owner, repo, structure)
    console.log(`Fetched ${fileContents.length} files for AI analysis`)

    // If no files found, create a basic analysis
    if (fileContents.length === 0) {
      console.log("No analyzable files found, creating basic analysis")
      return createBasicAnalysis(owner, repo, structure)
    }

    // Perform AI analysis with error handling
    let aiAnalysis: AIAnalysisResult
    try {
      aiAnalysis = await analyzeCodeWithAI(fileContents, structure.packageJson)
      console.log(`AI identified ${aiAnalysis.functionalities.length} functionalities`)
    } catch (error) {
      console.error("AI analysis failed, falling back to basic analysis:", error)
      aiAnalysis = createFallbackAIAnalysis(fileContents, structure)
    }

    // Enhance functionalities with additional data
    const enhancedFunctionalities = await enhanceFunctionalities(aiAnalysis.functionalities, fileContents, structure)

    return {
      repoUrl: `https://github.com/${owner}/${repo}`,
      owner,
      repo,
      structure,
      aiAnalysis,
      functionalities: enhancedFunctionalities,
      userFlows: aiAnalysis.userFlows || [],
      testScenarios: aiAnalysis.testScenarios || [],
      analyzedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Enhanced repository analysis error:", error)
    throw error
  }
}

function createBasicAnalysis(owner: string, repo: string, structure: any): EnhancedAnalysisResult {
  const basicFunctionality: EnhancedFunctionality = {
    id: "basic-functionality",
    name: "Basic Application Functionality",
    description: "General application functionality detected from repository structure",
    type: "other",
    confidence: 0.5,
    userStories: ["As a user, I want to interact with the application"],
    acceptanceCriteria: ["Application loads successfully", "Basic navigation works"],
    components: structure.components.slice(0, 5),
    files: [...structure.pages.slice(0, 3), ...structure.components.slice(0, 3)],
    apiEndpoints: structure.apiRoutes.slice(0, 3),
    selectors: ["body", "main", ".container", "#app"],
    routes: ["/"],
    interactions: [],
    testScenarios: [],
    businessRules: [],
  }

  return {
    repoUrl: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
    structure,
    aiAnalysis: {
      functionalities: [basicFunctionality],
      userFlows: [],
      testScenarios: [],
      businessLogic: [],
    },
    functionalities: [basicFunctionality],
    userFlows: [],
    testScenarios: [],
    analyzedAt: new Date().toISOString(),
  }
}

function createFallbackAIAnalysis(
  fileContents: Array<{ path: string; content: string }>,
  structure: any,
): AIAnalysisResult {
  // Create basic functionalities based on file analysis
  const functionalities = []

  // Look for common patterns
  const hasAuth = fileContents.some(
    (f) =>
      f.path.includes("login") ||
      f.path.includes("auth") ||
      f.content.includes("login") ||
      f.content.includes("signin"),
  )

  const hasForm = fileContents.some((f) => f.content.includes("<form") || f.content.includes("onSubmit"))

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
      apiEndpoints: [],
      selectors: ["#email", "#password", "[type='submit']"],
      interactions: [
        {
          type: "input",
          element: "Email field",
          selector: "#email",
          description: "User enters email",
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
      userStories: ["As a user, I want to submit forms"],
      acceptanceCriteria: ["Form validates input", "Form submits successfully"],
      components: [],
      routes: ["/"],
      apiEndpoints: [],
      selectors: ["form", "input", "button[type='submit']"],
      interactions: [],
    })
  }

  return {
    functionalities,
    userFlows: [],
    testScenarios: [],
    businessLogic: [],
  }
}

async function analyzeProjectStructure(owner: string, repo: string, contents: any[]) {
  const structure = {
    framework: "unknown",
    hasAppRouter: false,
    hasPagesRouter: false,
    components: [] as string[],
    pages: [] as string[],
    apiRoutes: [] as string[],
    packageJson: null as any,
    configFiles: [] as string[],
    testFiles: [] as string[],
  }

  try {
    // Check for package.json
    const packageJsonFile = contents.find((item) => item.name === "package.json")
    if (packageJsonFile) {
      try {
        const { data: packageData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: "package.json",
        })

        if ("content" in packageData) {
          const packageContent = Buffer.from(packageData.content, "base64").toString("utf-8")
          structure.packageJson = JSON.parse(packageContent)

          // Determine framework
          const deps = { ...structure.packageJson.dependencies, ...structure.packageJson.devDependencies }
          if (deps.next) structure.framework = "nextjs"
          else if (deps.react) structure.framework = "react"
          else if (deps.vue) structure.framework = "vue"
          else if (deps["@angular/core"]) structure.framework = "angular"
        }
      } catch (error) {
        console.error("Error parsing package.json:", error)
      }
    }

    // Analyze directory structure with error handling
    await analyzeDirectoryStructure(owner, repo, "", structure, 0)
  } catch (error) {
    console.error("Error analyzing project structure:", error)
  }

  return structure
}

async function analyzeDirectoryStructure(owner: string, repo: string, path: string, structure: any, depth: number) {
  // Limit recursion depth to avoid infinite loops and API rate limits
  if (depth > 2) return

  try {
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    })

    if (!Array.isArray(contents)) return

    for (const item of contents) {
      if (item.type === "file") {
        const filePath = item.path

        // Categorize files
        if (filePath.match(/\.(tsx?|jsx?)$/)) {
          if (filePath.includes("/pages/") || filePath.includes("/app/")) {
            if (filePath.includes("/api/")) {
              structure.apiRoutes.push(filePath)
            } else {
              structure.pages.push(filePath)
            }
          } else if (filePath.includes("/components/")) {
            structure.components.push(filePath)
          }
        } else if (filePath.match(/\.(test|spec)\.(tsx?|jsx?)$/)) {
          structure.testFiles.push(filePath)
        } else if (filePath.match(/\.(config|rc)\.(js|ts|json)$/)) {
          structure.configFiles.push(filePath)
        }
      } else if (item.type === "dir" && item.name !== "node_modules" && item.name !== ".git") {
        // Recursively analyze important subdirectories only
        if (["src", "app", "pages", "components", "lib", "utils"].includes(item.name)) {
          await analyzeDirectoryStructure(owner, repo, item.path, structure, depth + 1)
        }
      }
    }
  } catch (error) {
    console.error(`Error analyzing directory ${path}:`, error)
  }
}

async function fetchFileContents(
  owner: string,
  repo: string,
  structure: any,
): Promise<Array<{ path: string; content: string }>> {
  const fileContents: Array<{ path: string; content: string }> = []

  // Prioritize important files for analysis (limit to avoid timeouts)
  const importantFiles = [
    ...structure.pages.slice(0, 5), // Limit to first 5 pages
    ...structure.components.slice(0, 8), // Limit to first 8 components
    ...structure.apiRoutes.slice(0, 3), // Limit to first 3 API routes
  ]

  for (const filePath of importantFiles) {
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
      })

      if ("content" in fileData) {
        const content = Buffer.from(fileData.content, "base64").toString("utf-8")
        // Limit content size to avoid AI token limits
        const truncatedContent = content.length > 5000 ? content.substring(0, 5000) + "..." : content
        fileContents.push({ path: filePath, content: truncatedContent })
      }
    } catch (error) {
      console.error(`Error fetching ${filePath}:`, error)
      // Continue with other files even if one fails
    }
  }

  return fileContents
}

async function enhanceFunctionalities(
  aiFunctionalities: any[],
  fileContents: Array<{ path: string; content: string }>,
  structure: any,
): Promise<EnhancedFunctionality[]> {
  const enhanced: EnhancedFunctionality[] = []

  for (const func of aiFunctionalities) {
    try {
      // Find related files
      const relatedFiles = fileContents.filter(
        (f) =>
          func.components?.some((comp: string) => f.path.includes(comp.toLowerCase())) ||
          func.routes?.some((route: string) => f.path.includes(route.replace("/", ""))),
      )

      // Extract additional selectors from related files
      const additionalSelectors: string[] = []
      for (const file of relatedFiles.slice(0, 3)) {
        // Limit to avoid processing too many files
        try {
          const selectors = extractSelectors(file.content)
          additionalSelectors.push(...selectors.slice(0, 10)) // Limit selectors per file
        } catch (error) {
          console.error(`Error extracting selectors from ${file.path}:`, error)
        }
      }

      // Find related API endpoints
      const relatedEndpoints = structure.apiRoutes.filter((route: string) =>
        func.routes?.some((funcRoute: string) => route.includes(funcRoute.replace("/", ""))),
      )

      enhanced.push({
        id: func.id || `func-${enhanced.length}`,
        name: func.name || "Unknown Functionality",
        description: func.description || "Functionality detected in the codebase",
        type: func.type || "other",
        confidence: func.confidence || 0.5,
        userStories: func.userStories || [],
        acceptanceCriteria: func.acceptanceCriteria || [],
        components: func.components || [],
        files: relatedFiles.map((f) => f.path),
        apiEndpoints: [...(func.apiEndpoints || []), ...relatedEndpoints],
        selectors: [...new Set([...(func.selectors || []), ...additionalSelectors])].slice(0, 20), // Limit total selectors
        routes: func.routes || [],
        interactions: func.interactions || [],
        testScenarios: [],
        businessRules: [],
      })
    } catch (error) {
      console.error(`Error enhancing functionality ${func.id}:`, error)
      // Add a basic version even if enhancement fails
      enhanced.push({
        id: func.id || `func-${enhanced.length}`,
        name: func.name || "Unknown Functionality",
        description: func.description || "Functionality detected in the codebase",
        type: func.type || "other",
        confidence: 0.3,
        userStories: [],
        acceptanceCriteria: [],
        components: [],
        files: [],
        apiEndpoints: [],
        selectors: [],
        routes: [],
        interactions: [],
        testScenarios: [],
        businessRules: [],
      })
    }
  }

  return enhanced
}
