import { Octokit } from "@octokit/rest"
import { parseComponent } from "./component-parser"
import { extractSelectors } from "./selector-extractor"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export interface Functionality {
  id: string
  name: string
  description: string
  components: string[]
  files: string[]
  apiEndpoints: string[]
  selectors: string[]
  routes: string[]
  formFields: FormField[]
  interactions: Interaction[]
}

export interface FormField {
  name: string
  type: string
  selector: string
  required: boolean
}

export interface Interaction {
  type: "click" | "input" | "submit" | "navigation"
  selector: string
  description: string
}

export async function analyzeRepository(owner: string, repo: string) {
  try {
    // Get repository structure
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "",
    })

    // Analyze the project structure
    const structure = await analyzeProjectStructure(owner, repo, contents)

    // Extract functionalities
    const functionalities = await extractFunctionalities(owner, repo, structure)

    return {
      repoUrl: `https://github.com/${owner}/${repo}`,
      owner,
      repo,
      structure,
      functionalities,
      analyzedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error analyzing repository:", error)
    throw new Error("Failed to analyze repository")
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
  }

  // Check for package.json to determine framework
  const packageJsonFile = contents.find((item) => item.name === "package.json")
  if (packageJsonFile) {
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
  }

  // Check for App Router (Next.js 13+)
  const appDir = contents.find((item) => item.name === "app" && item.type === "dir")
  if (appDir) {
    structure.hasAppRouter = true
    await analyzeAppRouter(owner, repo, structure)
  }

  // Check for Pages Router
  const pagesDir = contents.find((item) => item.name === "pages" && item.type === "dir")
  if (pagesDir) {
    structure.hasPagesRouter = true
    await analyzePagesRouter(owner, repo, structure)
  }

  // Analyze components directory
  const componentsDir = contents.find((item) => item.name === "components" && item.type === "dir")
  if (componentsDir) {
    await analyzeComponentsDir(owner, repo, structure)
  }

  return structure
}

async function analyzeAppRouter(owner: string, repo: string, structure: any) {
  try {
    const { data: appContents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "app",
    })

    for (const item of appContents as any[]) {
      if (item.type === "dir") {
        // Check for page.tsx/page.js files
        try {
          const { data: routeContents } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path,
          })

          const pageFile = (routeContents as any[]).find(
            (file) =>
              file.name.startsWith("page.") &&
              (file.name.endsWith(".tsx") ||
                file.name.endsWith(".ts") ||
                file.name.endsWith(".jsx") ||
                file.name.endsWith(".js")),
          )

          if (pageFile) {
            structure.pages.push(item.path)
          }

          // Check for API routes
          const routeFile = (routeContents as any[]).find(
            (file) =>
              file.name.startsWith("route.") &&
              (file.name.endsWith(".tsx") ||
                file.name.endsWith(".ts") ||
                file.name.endsWith(".jsx") ||
                file.name.endsWith(".js")),
          )

          if (routeFile) {
            structure.apiRoutes.push(item.path)
          }
        } catch (error) {
          // Skip if can't access directory
        }
      }
    }
  } catch (error) {
    console.error("Error analyzing app router:", error)
  }
}

async function analyzePagesRouter(owner: string, repo: string, structure: any) {
  try {
    const { data: pagesContents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "pages",
    })

    for (const item of pagesContents as any[]) {
      if (
        item.type === "file" &&
        (item.name.endsWith(".tsx") ||
          item.name.endsWith(".ts") ||
          item.name.endsWith(".jsx") ||
          item.name.endsWith(".js"))
      ) {
        if (item.path.includes("/api/")) {
          structure.apiRoutes.push(item.path)
        } else {
          structure.pages.push(item.path)
        }
      } else if (item.type === "dir") {
        // Recursively analyze subdirectories
        await analyzeDirectory(owner, repo, item.path, structure)
      }
    }
  } catch (error) {
    console.error("Error analyzing pages router:", error)
  }
}

async function analyzeComponentsDir(owner: string, repo: string, structure: any) {
  try {
    await analyzeDirectory(owner, repo, "components", structure, "components")
  } catch (error) {
    console.error("Error analyzing components directory:", error)
  }
}

async function analyzeDirectory(
  owner: string,
  repo: string,
  path: string,
  structure: any,
  type: "components" | "pages" | "api" = "pages",
) {
  try {
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    })

    for (const item of contents as any[]) {
      if (
        item.type === "file" &&
        (item.name.endsWith(".tsx") ||
          item.name.endsWith(".ts") ||
          item.name.endsWith(".jsx") ||
          item.name.endsWith(".js"))
      ) {
        if (type === "components") {
          structure.components.push(item.path)
        } else if (item.path.includes("/api/")) {
          structure.apiRoutes.push(item.path)
        } else {
          structure.pages.push(item.path)
        }
      } else if (item.type === "dir") {
        await analyzeDirectory(owner, repo, item.path, structure, type)
      }
    }
  } catch (error) {
    console.error(`Error analyzing directory ${path}:`, error)
  }
}

async function extractFunctionalities(owner: string, repo: string, structure: any): Promise<Functionality[]> {
  const functionalities: Functionality[] = []

  // Analyze pages to extract functionalities
  for (const pagePath of structure.pages) {
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: pagePath,
      })

      if ("content" in fileData) {
        const content = Buffer.from(fileData.content, "base64").toString("utf-8")
        const functionality = await analyzePageFunctionality(pagePath, content, structure)

        if (functionality) {
          functionalities.push(functionality)
        }
      }
    } catch (error) {
      console.error(`Error analyzing page ${pagePath}:`, error)
    }
  }

  return functionalities
}

async function analyzePageFunctionality(
  pagePath: string,
  content: string,
  structure: any,
): Promise<Functionality | null> {
  try {
    // Parse the component
    const componentData = parseComponent(content)

    // Extract selectors
    const selectors = extractSelectors(content)

    // Determine functionality type based on file name and content
    const fileName =
      pagePath
        .split("/")
        .pop()
        ?.replace(/\.(tsx|ts|jsx|js)$/, "") || ""

    let functionalityType = "page"
    let name = fileName
    let description = `${fileName} page functionality`

    // Identify specific functionality types
    if (fileName.includes("login") || content.includes("login") || content.includes("signin")) {
      functionalityType = "authentication"
      name = "User Login"
      description = "User authentication and login functionality"
    } else if (
      fileName.includes("signup") ||
      fileName.includes("register") ||
      content.includes("signup") ||
      content.includes("register")
    ) {
      functionalityType = "registration"
      name = "User Registration"
      description = "New user account creation and registration"
    } else if (fileName.includes("dashboard") || content.includes("dashboard")) {
      functionalityType = "dashboard"
      name = "User Dashboard"
      description = "Main user interface and dashboard functionality"
    } else if (fileName.includes("profile") || content.includes("profile")) {
      functionalityType = "profile"
      name = "User Profile"
      description = "User profile management and settings"
    } else if (fileName.includes("checkout") || content.includes("checkout")) {
      functionalityType = "checkout"
      name = "Checkout Process"
      description = "E-commerce checkout and payment functionality"
    }

    // Extract form fields
    const formFields = extractFormFields(content)

    // Extract interactions
    const interactions = extractInteractions(content, selectors)

    // Find related API endpoints
    const relatedEndpoints = structure.apiRoutes.filter(
      (route: string) => route.includes(fileName) || route.includes(functionalityType),
    )

    return {
      id: fileName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name,
      description,
      components: componentData.components,
      files: [pagePath],
      apiEndpoints: relatedEndpoints,
      selectors,
      routes: [getRouteFromPath(pagePath)],
      formFields,
      interactions,
    }
  } catch (error) {
    console.error("Error analyzing page functionality:", error)
    return null
  }
}

function extractFormFields(content: string): FormField[] {
  const formFields: FormField[] = []

  // Look for input elements
  const inputRegex = /<input[^>]*>/gi
  const inputs = content.match(inputRegex) || []

  inputs.forEach((input) => {
    const typeMatch = input.match(/type=["']([^"']+)["']/)
    const nameMatch = input.match(/name=["']([^"']+)["']/)
    const idMatch = input.match(/id=["']([^"']+)["']/)
    const requiredMatch = input.includes("required")

    const type = typeMatch ? typeMatch[1] : "text"
    const name = nameMatch ? nameMatch[1] : idMatch ? idMatch[1] : "unknown"
    const selector = idMatch ? `#${idMatch[1]}` : nameMatch ? `[name="${nameMatch[1]}"]` : "input"

    formFields.push({
      name,
      type,
      selector,
      required: requiredMatch,
    })
  })

  return formFields
}

function extractInteractions(content: string, selectors: string[]): Interaction[] {
  const interactions: Interaction[] = []

  // Look for buttons
  const buttonRegex = /<button[^>]*>([^<]*)<\/button>/gi
  let buttonMatch
  while ((buttonMatch = buttonRegex.exec(content)) !== null) {
    const buttonText = buttonMatch[1].trim()
    const buttonSelector = selectors.find((s) => s.includes("button")) || "button"

    interactions.push({
      type: "click",
      selector: buttonSelector,
      description: `Click ${buttonText} button`,
    })
  }

  // Look for form submissions
  if (content.includes("onSubmit") || content.includes("handleSubmit")) {
    interactions.push({
      type: "submit",
      selector: "form",
      description: "Submit form",
    })
  }

  // Look for navigation links
  const linkRegex = /<Link[^>]*to=["']([^"']+)["'][^>]*>([^<]*)<\/Link>/gi
  let linkMatch
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    const href = linkMatch[1]
    const linkText = linkMatch[2].trim()

    interactions.push({
      type: "navigation",
      selector: `[href="${href}"]`,
      description: `Navigate to ${linkText}`,
    })
  }

  return interactions
}

function getRouteFromPath(pagePath: string): string {
  // Convert file path to route
  const route = pagePath
    .replace(/^(app|pages)\//, "/")
    .replace(/\/page\.(tsx|ts|jsx|js)$/, "")
    .replace(/\.(tsx|ts|jsx|js)$/, "")
    .replace(/\/index$/, "")

  if (route === "/") return "/"
  return route || "/"
}
