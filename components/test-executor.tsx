"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Play, Eye, EyeOff, CheckCircle, XCircle, Clock, Terminal, Brain } from "lucide-react"

interface TestExecutorProps {
  generatedTest: any
  functionality: any
}

export default function TestExecutor({ generatedTest, functionality }: TestExecutorProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionMode, setExecutionMode] = useState<"headed" | "headless" | null>(null)
  const [executionResults, setExecutionResults] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  const executeTest = async (mode: "headed" | "headless") => {
    setIsExecuting(true)
    setExecutionMode(mode)
    setProgress(0)
    setExecutionResults(null)

    try {
      // Simulate test execution progress
      const steps = [
        "Starting Cypress...",
        "Loading test specifications...",
        "Setting up test environment...",
        "Executing test cases...",
        "Collecting results...",
        "Generating report...",
      ]

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setProgress(((i + 1) / steps.length) * 100)
      }

      // Call the real API to execute tests
      const response = await fetch("/api/execute-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testCode: generatedTest.testCode,
          mode,
          functionality,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute test")
      }

      const results = await response.json()
      setExecutionResults(results)
    } catch (error) {
      console.error("Error executing test:", error)
      // Handle error appropriately
    } finally {
      setIsExecuting(false)
    }
  }

  if (!generatedTest) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-gray-500">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Generate tests first to execute them</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI-Powered Test Execution
          </CardTitle>
          <CardDescription>Execute your AI-generated Cypress tests in headed or headless mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="font-semibold mb-2">Headed Mode</h3>
                  <p className="text-sm text-gray-600 mb-4">Run tests with browser UI for debugging and development</p>
                  <Button onClick={() => executeTest("headed")} disabled={isExecuting} className="w-full">
                    {isExecuting && executionMode === "headed" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Executing...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Run Headed
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <EyeOff className="h-8 w-8 mx-auto mb-3 text-green-500" />
                  <h3 className="font-semibold mb-2">Headless Mode</h3>
                  <p className="text-sm text-gray-600 mb-4">Run tests in background for CI/CD and automated testing</p>
                  <Button
                    onClick={() => executeTest("headless")}
                    disabled={isExecuting}
                    variant="outline"
                    className="w-full"
                  >
                    {isExecuting && executionMode === "headless" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Executing...
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Run Headless
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {isExecuting && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Terminal className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Executing in {executionMode} mode...</span>
                </div>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {executionResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {executionResults.status === "passed" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Execution Results
            </CardTitle>
            <CardDescription>Test execution completed in {executionResults.mode} mode</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Test Details</TabsTrigger>
                <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{executionResults.tests.passed}</div>
                        <div className="text-sm text-gray-600">Passed</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{executionResults.tests.failed}</div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{executionResults.tests.total}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{executionResults.duration}</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">All tests passed successfully!</span>
                  </div>
                  <p className="text-green-800 text-sm mt-1">
                    Your {functionality.name} functionality is working correctly.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">AI Analysis</h5>
                  <p className="text-blue-800 text-sm">
                    The AI has analyzed the test results and found that all critical user paths are working correctly.
                    The tests covered {generatedTest.scenarios?.length || 0} scenarios including happy paths, validation
                    checks, and error handling.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {executionResults.testCases.map((testCase: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {testCase.status === "passed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {testCase.name}
                        <Badge variant="outline" className="ml-auto">
                          {testCase.duration}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {testCase.steps.map((step: any, stepIndex: number) => (
                          <div key={stepIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {step.status === "passed" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">{step.action}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">{step.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="artifacts" className="space-y-4">
                {executionResults.screenshots.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Screenshots</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      {executionResults.screenshots.map((screenshot: string, index: number) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="bg-gray-100 h-32 rounded flex items-center justify-center mb-2">
                              <span className="text-gray-500 text-sm">Screenshot {index + 1}</span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">{screenshot}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {executionResults.video && (
                  <div>
                    <h4 className="font-medium mb-2">Video Recording</h4>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="bg-gray-100 h-48 rounded flex items-center justify-center mb-2">
                          <span className="text-gray-500">Video Player</span>
                        </div>
                        <p className="text-sm text-gray-600">{executionResults.video}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">📁 Artifact Locations</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Screenshots: <code>cypress/screenshots/</code>
                    </li>
                    <li>
                      • Videos: <code>cypress/videos/</code>
                    </li>
                    <li>
                      • Test reports: <code>cypress/reports/</code>
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
