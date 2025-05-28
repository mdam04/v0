"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { GitBranch, FileText, Globe, Database, ArrowRight, Brain, Code, Lightbulb } from "lucide-react"

interface RepositoryAnalysisProps {
  analysisData: any
  onNext: () => void
}

export default function RepositoryAnalysis({ analysisData, onNext }: RepositoryAnalysisProps) {
  const [activeTab, setActiveTab] = useState<"functionalities" | "userFlows" | "testScenarios">("functionalities")

  if (!analysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repository Analysis</CardTitle>
          <CardDescription>Enter a repository URL above to begin analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No repository analyzed yet</p>
          </div>
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
            AI Analysis Results
          </CardTitle>
          <CardDescription>
            AI has identified {analysisData.functionalities.length} user-facing functionalities and{" "}
            {analysisData.userFlows?.length || 0} user flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Repository URL</h4>
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">{analysisData.repoUrl}</code>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-blue-50">
                {analysisData.structure?.framework || "Unknown"} Framework
              </Badge>
              {analysisData.structure?.hasAppRouter && (
                <Badge variant="outline" className="bg-green-50">
                  App Router
                </Badge>
              )}
              {analysisData.structure?.hasPagesRouter && (
                <Badge variant="outline" className="bg-yellow-50">
                  Pages Router
                </Badge>
              )}
            </div>

            <Separator />

            <div className="flex space-x-2 mb-4">
              <Button
                variant={activeTab === "functionalities" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("functionalities")}
              >
                <Code className="h-4 w-4 mr-2" />
                Functionalities
              </Button>
              <Button
                variant={activeTab === "userFlows" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("userFlows")}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                User Flows
              </Button>
              <Button
                variant={activeTab === "testScenarios" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("testScenarios")}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Test Scenarios
              </Button>
            </div>

            {activeTab === "functionalities" && (
              <div>
                <h4 className="font-medium mb-4">Discovered Functionalities</h4>
                <div className="grid gap-4">
                  {analysisData.functionalities.map((func: any) => (
                    <Card key={func.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold">{func.name}</h5>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{func.type}</Badge>
                            <Badge
                              variant="outline"
                              className={
                                func.confidence > 0.8
                                  ? "bg-green-50 text-green-700"
                                  : func.confidence > 0.6
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-red-50 text-red-700"
                              }
                            >
                              {Math.round(func.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{func.description}</p>

                        {func.userStories && func.userStories.length > 0 && (
                          <div className="mb-3 bg-blue-50 p-3 rounded-md">
                            <h6 className="font-medium text-blue-700 mb-1">User Stories</h6>
                            <ul className="list-disc pl-5 text-sm text-blue-800">
                              {func.userStories.slice(0, 2).map((story: string, idx: number) => (
                                <li key={idx}>{story}</li>
                              ))}
                              {func.userStories.length > 2 && (
                                <li className="text-blue-500">+{func.userStories.length - 2} more</li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">Components</span>
                            </div>
                            <div className="space-y-1">
                              {func.components.map((comp: string) => (
                                <Badge key={comp} variant="outline" className="mr-1">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Globe className="h-4 w-4" />
                              <span className="font-medium">API Endpoints</span>
                            </div>
                            <div className="space-y-1">
                              {func.apiEndpoints.map((endpoint: string) => (
                                <code key={endpoint} className="block bg-gray-100 px-2 py-1 rounded text-xs">
                                  {endpoint}
                                </code>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="h-4 w-4" />
                            <span className="font-medium text-sm">DOM Selectors</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {func.selectors.slice(0, 5).map((selector: string) => (
                              <code key={selector} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {selector}
                              </code>
                            ))}
                            {func.selectors.length > 5 && (
                              <Badge variant="outline">+{func.selectors.length - 5} more</Badge>
                            )}
                          </div>
                        </div>

                        {func.interactions && func.interactions.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <span className="font-medium text-sm">Interactions</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {func.interactions.slice(0, 4).map((interaction: any, idx: number) => (
                                <div key={idx} className="bg-amber-50 p-2 rounded text-xs">
                                  <span className="font-medium">{interaction.type}:</span> {interaction.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "userFlows" && (
              <div>
                <h4 className="font-medium mb-4">User Flows</h4>
                {analysisData.userFlows && analysisData.userFlows.length > 0 ? (
                  <div className="grid gap-4">
                    {analysisData.userFlows.map((flow: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold">{flow.name}</h5>
                            <Badge variant="outline">{flow.userType}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{flow.description}</p>

                          <div className="bg-gray-50 p-3 rounded-md">
                            <h6 className="font-medium mb-2">Flow Steps</h6>
                            <ol className="list-decimal pl-5 space-y-2">
                              {flow.steps.map((step: any, stepIdx: number) => (
                                <li key={stepIdx} className="text-sm">
                                  <span className="font-medium">{step.action}</span>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Element: {step.element} ({step.selector})
                                  </div>
                                  <div className="text-xs text-gray-600">Expected: {step.expectedResult}</div>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="flex justify-between mt-3 text-sm text-gray-500">
                            <div>
                              Start: <Badge variant="outline">{flow.startPage}</Badge>
                            </div>
                            <div>
                              End: <Badge variant="outline">{flow.endPage}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No user flows detected in this repository</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "testScenarios" && (
              <div>
                <h4 className="font-medium mb-4">Test Scenarios</h4>
                {analysisData.testScenarios && analysisData.testScenarios.length > 0 ? (
                  <div className="grid gap-4">
                    {analysisData.testScenarios.map((scenario: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold">{scenario.name}</h5>
                            <div className="flex gap-2">
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
                              <Badge
                                variant="outline"
                                className={
                                  scenario.priority === "high"
                                    ? "bg-red-50 text-red-700"
                                    : scenario.priority === "medium"
                                      ? "bg-yellow-50 text-yellow-700"
                                      : "bg-green-50 text-green-700"
                                }
                              >
                                {scenario.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{scenario.description}</p>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h6 className="font-medium mb-2 text-sm">Preconditions</h6>
                              <ul className="list-disc pl-5 text-sm text-gray-600">
                                {scenario.preconditions.map((condition: string, condIdx: number) => (
                                  <li key={condIdx}>{condition}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h6 className="font-medium mb-2 text-sm">Steps</h6>
                              <ol className="list-decimal pl-5 text-sm text-gray-600">
                                {scenario.steps.map((step: string, stepIdx: number) => (
                                  <li key={stepIdx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          </div>

                          <div className="mt-3">
                            <h6 className="font-medium mb-2 text-sm">Expected Results</h6>
                            <ul className="list-disc pl-5 text-sm text-gray-600">
                              {scenario.expectedResults.map((result: string, resIdx: number) => (
                                <li key={resIdx}>{result}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No test scenarios detected in this repository</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} size="lg">
          Continue to Functionality Mapping
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
