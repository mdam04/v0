import { type NextRequest, NextResponse } from "next/server"
import { analyzeRepositoryWithAI } from "@/lib/enhanced-repository-analyzer"

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json()

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
    }

    // Extract owner and repo from GitHub URL with better regex
    const urlMatch = repoUrl.match(/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git|\/|$)/)
    if (!urlMatch) {
      return NextResponse.json(
        {
          error: "Invalid GitHub URL format. Please use: https://github.com/owner/repository",
        },
        { status: 400 },
      )
    }

    const [, owner, repo] = urlMatch
    const cleanRepo = repo.replace(/\.git$/, "").replace(/\/$/, "")

    // Validate GitHub token
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        {
          error: "GitHub token not configured. Please add GITHUB_TOKEN environment variable.",
        },
        { status: 500 },
      )
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY environment variable.",
        },
        { status: 500 },
      )
    }

    console.log(`Starting AI analysis for ${owner}/${cleanRepo}`)

    // Perform AI-powered analysis with timeout
    const analysisPromise = analyzeRepositoryWithAI(owner, cleanRepo)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Analysis timeout after 60 seconds")), 60000),
    )

    const analysisData = await Promise.race([analysisPromise, timeoutPromise])

    console.log(`Analysis complete: found ${analysisData.functionalities.length} functionalities`)

    return NextResponse.json(analysisData)
  } catch (error) {
    console.error("Repository analysis error:", error)

    let errorMessage = "Failed to analyze repository"
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes("Not Found")) {
        errorMessage = "Repository not found. Please check the URL and ensure the repository is public."
        statusCode = 404
      } else if (error.message.includes("rate limit")) {
        errorMessage = "GitHub API rate limit exceeded. Please try again later."
        statusCode = 429
      } else if (error.message.includes("timeout")) {
        errorMessage = "Analysis timed out. The repository might be too large or complex."
        statusCode = 408
      } else if (error.message.includes("Forbidden")) {
        errorMessage =
          "Access denied. Please check if the repository is public or if the GitHub token has proper permissions."
        statusCode = 403
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode },
    )
  }
}
