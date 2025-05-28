import { type NextRequest, NextResponse } from "next/server"
import { generateEnhancedCypressTest } from "@/lib/enhanced-test-generator"

export async function POST(request: NextRequest) {
  try {
    const { functionality, context } = await request.json()

    if (!functionality) {
      return NextResponse.json({ error: "Functionality data is required" }, { status: 400 })
    }

    console.log(`Generating enhanced test for ${functionality.name}`)

    // Generate enhanced Cypress test with AI
    const testData = await generateEnhancedCypressTest(functionality, context)

    console.log(`Test generation complete for ${functionality.name}`)

    return NextResponse.json(testData)
  } catch (error) {
    console.error("Enhanced test generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate test",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
