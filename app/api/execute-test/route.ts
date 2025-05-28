import { type NextRequest, NextResponse } from "next/server"
import { executeTest } from "@/lib/test-executor"

export async function POST(request: NextRequest) {
  try {
    const { testCode, mode, functionality } = await request.json()

    if (!testCode || !mode) {
      return NextResponse.json({ error: "Test code and mode are required" }, { status: 400 })
    }

    // Execute the test
    const results = await executeTest(testCode, mode, functionality)

    return NextResponse.json(results)
  } catch (error) {
    console.error("Test execution error:", error)
    return NextResponse.json({ error: "Failed to execute test" }, { status: 500 })
  }
}
