"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Code, Target, ArrowRight, CheckCircle, Lightbulb, FileText, Brain } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FunctionalityMapperProps {
  analysisData: any
  selectedFunctionality: any
  onSelectFunctionality: (func: any) => void
  onNext: () => void
}

export default function FunctionalityMapper({
  analysisData,
  selectedFunctionality,
  onSelectFunctionality,
  onNext,
}: FunctionalityMapperProps) {
  const [selectorDetails, setSelectorDetails] = useState("")
  const [activeTab, setActiveTab] = useState<"selectors" | "scenarios" | "stories">("selectors")

  if (!analysisData) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-gray-500">
          <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Complete repository analysis first</p>
        </CardContent>
      </Card>
    )
  }

  const handleFunctionalitySelect = (funcId: string) => {
    const func = analysisData.functionalities.find((f: any) => f.id === funcId)
    onSelectFunctionality(func)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Functionality Selection
          </CardTitle>
          <CardDescription>Choose a functionality to generate comprehensive test cases</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedFunctionality?.id || ""} onValueChange={handleFunctionalitySelect}>
            <div className="space-y-4">
              {analysisData.functionalities.map((func: any) => (
                <div key={func.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={func.id} id={func.id} className="mt-1" />
                  <Label htmlFor={func.id} className="flex-1 cursor-pointer">
                    <Card
                      className={`transition-colors ${
                        selectedFunctionality?.id === func.id ? "border-blue-500 bg-blue-50" : ""
                      }`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{func.name}</h4>
                            <p className="text-sm text-gray-500">{func.type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedFunctionality?.id === func.id && <CheckCircle className="h-5 w-5 text-blue-500" />}
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

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Files:</span>
                            <div className="mt-1">
                              {func.files.slice(0, 2).map((file: string) => (
                                <div key={file} className="text-gray-600 truncate">
                                  {file}
                                </div>
                              ))}
                              {func.files.length > 2 && (
                                <span className="text-gray-500 text-xs">+{func.files.length - 2} more</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="font-medium">Components:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {func.components.slice(0, 3).map((comp: string) => (
                                <Badge key={comp} variant="outline" className="text-xs">
                                  {comp}
                                </Badge>
                              ))}
                              {func.components.length > 3 && (
                                <span className="text-gray-500 text-xs">+{func.components.length - 3} more</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="font-medium">Interactions:</span>
                            <div className="mt-1">
                              {func.interactions && func.interactions.length > 0 ? (
                                <>
                                  <div className="text-xs text-gray-600">
                                    {func.interactions.length} interaction{func.interactions.length > 1 ? "s" : ""}{" "}
                                    detected
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    {Array.from(new Set(func.interactions.map((i: any) => i.type)))
                                      .slice(0, 3)
                                      .map((type: string) => (
                                        <Badge key={type} variant="secondary" className="text-xs">
                                          {type}
                                        </Badge>
                                      ))}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-500 text-xs">No interactions detected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {selectedFunctionality && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI-Powered Functionality Details
            </CardTitle>
            <CardDescription>
              AI has analyzed {selectedFunctionality.name} and identified key testing elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab as any}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="selectors">
                  <Target className="h-4 w-4 mr-2" />
                  Selectors
                </TabsTrigger>
                <TabsTrigger value="scenarios">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Test Scenarios
                </TabsTrigger>
                <TabsTrigger value="stories">
                  <FileText className="h-4 w-4 mr-2" />
                  User Stories
                </TabsTrigger>
              </TabsList>

              <TabsContent value="selectors" className="space-y-4 pt-4">
                <div>
                  <h4 className="font-medium mb-3">Extracted Selectors</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedFunctionality.selectors.map((selector: string, index: number) => (
                      <div key={selector} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <code className="text-sm">{selector}</code>
                        <Badge variant="secondary">#{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Detected Interactions</h4>
                  <div className="space-y-3">
                    {selectedFunctionality.interactions && selectedFunctionality.interactions.length > 0 ? (
                      selectedFunctionality.interactions.map((interaction: any, idx: number) => (
                        <div key={idx} className="bg-blue-50 p-3 rounded-md">
                          <div className="flex justify-between">
                            <span className="font-medium text-blue-700">
                              {interaction.type}: {interaction.element}
                            </span>
                            <Badge variant="outline">{interaction.selector}</Badge>
                          </div>
                          <p className="text-sm text-blue-800 mt-1">{interaction.description}</p>
                          {interaction.validation && (
                            <p className="text-xs text-blue-600 mt-1">Validation: {interaction.validation}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No interactions detected</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="selector-details" className="text-base font-medium">
                    Additional Context (Optional)
                  </Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Provide any additional context about the functionality or specific test scenarios
                  </p>
                  <Textarea
                    id="selector-details"
                    placeholder="e.g., This form requires email validation, the submit button should be disabled until all fields are valid..."
                    value={selectorDetails}
                    onChange={(e) => setSelectorDetails(e.target.value)}
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="scenarios" className="space-y-4 pt-4">
                <div>
                  <h4 className="font-medium mb-3">AI-Generated Test Scenarios</h4>
                  <div className="space-y-4">
                    {selectedFunctionality.testScenarios && selectedFunctionality.testScenarios.length > 0 ? (
                      selectedFunctionality.testScenarios.map((scenario: any, idx: number) => (
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

                            <div className="bg-gray-50 p-3 rounded-md">
                              <h6 className="font-medium mb-2 text-sm">Steps</h6>
                              <ol className="list-decimal pl-5 text-sm text-gray-600">
                                {scenario.steps.map((step: string, stepIdx: number) => (
                                  <li key={stepIdx}>{step}</li>
                                ))}
                              </ol>
                            </div>

                            <div className="mt-3">
                              <h6 className="font-medium mb-2 text-sm">Assertions</h6>
                              <ul className="list-disc pl-5 text-sm text-gray-600">
                                {scenario.assertions.map((assertion: string, assertIdx: number) => (
                                  <li key={assertIdx}>{assertion}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No test scenarios available for this functionality</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stories" className="space-y-4 pt-4">
                <div>
                  <h4 className="font-medium mb-3">User Stories</h4>
                  <div className="space-y-3">
                    {selectedFunctionality.userStories && selectedFunctionality.userStories.length > 0 ? (
                      selectedFunctionality.userStories.map((story: string, idx: number) => (
                        <div key={idx} className="bg-green-50 p-3 rounded-md">
                          <p className="text-green-800">{story}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No user stories available</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Acceptance Criteria</h4>
                  <div className="space-y-3">
                    {selectedFunctionality.acceptanceCriteria && selectedFunctionality.acceptanceCriteria.length > 0 ? (
                      selectedFunctionality.acceptanceCriteria.map((criteria: string, idx: number) => (
                        <div key={idx} className="bg-blue-50 p-3 rounded-md">
                          <p className="text-blue-800">{criteria}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No acceptance criteria available</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Business Rules</h4>
                  <div className="space-y-3">
                    {selectedFunctionality.businessRules && selectedFunctionality.businessRules.length > 0 ? (
                      selectedFunctionality.businessRules.map((rule: string, idx: number) => (
                        <div key={idx} className="bg-amber-50 p-3 rounded-md">
                          <p className="text-amber-800">{rule}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No business rules available</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selectedFunctionality} size="lg">
          Generate Cypress Tests
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
