"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TestTube, ArrowRight, Copy, CheckCircle, Brain, FileText, Settings } from "lucide-react"

interface TestGeneratorProps {
  functionality: any
  onTestGenerated: (test: any) => void
  onNext: () => void
}

export default function TestGenerator({ functionality, onTestGenerated, onNext }: TestGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedTest, setGeneratedTest] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("code")

  useEffect(() => {
    if (functionality && !generatedTest) {
      generateTest()
    }
  }, [functionality])

  const generateTest = async () => {
    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress steps
      const steps = [
        "Analyzing functionality requirements...",
        "Extracting DOM selectors and interactions...",
        "Generating test scenarios...",
        "Creating setup and teardown logic...",
        "Optimizing for reliability...",
        "Finalizing test code...",
      ]

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        setProgress(((i + 1) / steps.length) * 100)
      }

      // Call the real API to generate tests
      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          functionality,
          context: "Generate comprehensive Cypress tests",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate test")
      }

      const testData = await response.json()
      setGeneratedTest(testData)
      onTestGenerated(testData)
    } catch (error) {
      console.error("Error generating test:", error)
      // Handle error appropriately
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (generatedTest) {
      await navigator.clipboard.writeText(generatedTest.testCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!functionality) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-gray-500">
          <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a functionality to generate tests</p>
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
            AI-Powered Test Generation
          </CardTitle>
          <CardDescription>
            Generating comprehensive Cypress tests for {functionality.name} using advanced AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating comprehensive test suite...</p>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          ) : generatedTest ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Test generation completed!</span>
              </div>

              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="code">
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Code
                  </TabsTrigger>
                  <TabsTrigger value="scenarios">
                    <FileText className="h-4 w-4 mr-2" />
                    Scenarios
                  </TabsTrigger>
                  <TabsTrigger value="setup">
                    <Settings className="h-4 w-4 mr-2" />
                    Setup
                  </TabsTrigger>
                  <TabsTrigger value="execution">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Execution
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Test File: {generatedTest.testFile}</h4>
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generatedTest.testCode}</code>
                  </pre>
                </TabsContent>

                <TabsContent value="scenarios" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Test Scenarios</h4>
                    <div className="space-y-4">
                      {generatedTest.scenarios && generatedTest.scenarios.length > 0 ? (
                        generatedTest.scenarios.map((scenario: any, idx: number) => (
                          <Card key={idx}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-semibold">{scenario.name}</h5>
                                <Badge
                                  variant="outline"
                                  className={
                                    scenario.type === "happy_path"
                                      ? "bg-green-50 text-green-700"
                                      : scenario.type === "error_handling"
                                        ? "bg-red-50 text-red-700"
                                        : scenario.type === "security"
                                          ? "bg-purple-50 text-purple-700"
                                          : "bg-blue-50 text-blue-700"
                                  }
                                >
                                  {scenario.type.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-3">{scenario.description}</p>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h6 className="font-medium mb-2 text-sm">Steps</h6>
                                  <ol className="list-decimal pl-5 text-sm text-gray-600">
                                    {scenario.steps.map((step: string, stepIdx: number) => (
                                      <li key={stepIdx}>{step}</li>
                                    ))}
                                  </ol>
                                </div>

                                <div>
                                  <h6 className="font-medium mb-2 text-sm">Assertions</h6>
                                  <ul className="list-disc pl-5 text-sm text-gray-600">
                                    {scenario.assertions.map((assertion: string, assertIdx: number) => (
                                      <li key={assertIdx}>{assertion}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <p className="text-gray-500">No test scenarios available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {generatedTest.userStories && generatedTest.userStories.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">User Stories</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <ul className="list-disc pl-5 text-sm text-blue-800 space-y-2">
                          {generatedTest.userStories.map((story: string, idx: number) => (
                            <li key={idx}>{story}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="setup" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Dependencies</h4>
                    <div className="space-y-2">
                      {generatedTest.dependencies.map((dep: string) => (
                        <Badge key={dep} variant="outline">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Setup Commands</h4>
                    <div className="space-y-2">
                      {generatedTest.setupCommands.map((cmd: string, index: number) => (
                        <code key={index} className="block bg-gray-100 p-2 rounded text-sm">
                          {cmd}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Preconditions</h4>
                    <ul className="space-y-1">
                      {generatedTest.preconditions.map((condition: string, index: number) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Configuration Files</h4>
                    <div className="space-y-3">
                      {generatedTest.configFiles.map((config: any, idx: number) => (
                        <Card key={idx}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm">{config.name}</CardTitle>
                            <CardDescription className="text-xs">{config.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                              <code>{config.content}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="execution" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Headless Mode (CI/CD)</h4>
                    <code className="block bg-gray-100 p-3 rounded text-sm">{generatedTest.headlessCommand}</code>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Headed Mode (Development)</h4>
                    <code className="block bg-gray-100 p-3 rounded text-sm">{generatedTest.headedCommand}</code>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use headed mode for debugging and test development</li>
                      <li>• Use headless mode for CI/CD pipelines</li>
                      <li>• Ensure your application is running before executing tests</li>
                      <li>• Add the generated config files to your project root</li>
                      <li>• Consider adding custom commands to your support file</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {generatedTest && (
        <div className="flex justify-end">
          <Button onClick={onNext} size="lg">
            Execute Tests
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
