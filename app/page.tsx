"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitBranch, Zap, TestTube, Play, Code } from "lucide-react"
import RepositoryAnalysis from "@/components/repository-analysis"
import FunctionalityMapper from "@/components/functionality-mapper"
import TestGenerator from "@/components/test-generator"
import TestExecutor from "@/components/test-executor"

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("")
  const [currentStep, setCurrentStep] = useState("analyze")
  const [analysisData, setAnalysisData] = useState(null)
  const [selectedFunctionality, setSelectedFunctionality] = useState(null)
  const [generatedTest, setGeneratedTest] = useState(null)

  const handleAnalyze = async () => {
    if (!repoUrl) return

    try {
      setCurrentStep("analyze")

      // Call our API to analyze the repository
      const response = await fetch("/api/analyze-repository", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze repository")
      }

      const analysisData = await response.json()
      setAnalysisData(analysisData)
      setCurrentStep("map")
    } catch (error) {
      console.error("Error analyzing repository:", error)
      // Handle error appropriately
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Test Automation Framework</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Intelligent test generation powered by AI. Analyze repositories, extract functionality, and generate
            comprehensive Cypress tests automatically.
          </p>
        </div>

        {/* Repository Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Repository Analysis
            </CardTitle>
            <CardDescription>Enter a GitHub repository URL to begin AI-powered analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAnalyze} disabled={!repoUrl}>
                <Zap className="h-4 w-4 mr-2" />
                Analyze Repository
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { id: "analyze", label: "Analyze", icon: GitBranch },
              { id: "map", label: "Map Functions", icon: Code },
              { id: "generate", label: "Generate Tests", icon: TestTube },
              { id: "execute", label: "Execute", icon: Play },
            ].map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = ["analyze", "map", "generate", "execute"].indexOf(currentStep) > index

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive
                        ? "border-blue-500 bg-blue-500 text-white"
                        : isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < 3 && <div className={`w-8 h-0.5 mx-4 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analyze" disabled={!repoUrl}>
              <GitBranch className="h-4 w-4 mr-2" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="map" disabled={!analysisData}>
              <Code className="h-4 w-4 mr-2" />
              Map Functions
            </TabsTrigger>
            <TabsTrigger value="generate" disabled={!selectedFunctionality}>
              <TestTube className="h-4 w-4 mr-2" />
              Generate Tests
            </TabsTrigger>
            <TabsTrigger value="execute" disabled={!generatedTest}>
              <Play className="h-4 w-4 mr-2" />
              Execute
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze">
            <RepositoryAnalysis analysisData={analysisData} onNext={() => setCurrentStep("map")} />
          </TabsContent>

          <TabsContent value="map">
            <FunctionalityMapper
              analysisData={analysisData}
              selectedFunctionality={selectedFunctionality}
              onSelectFunctionality={setSelectedFunctionality}
              onNext={() => setCurrentStep("generate")}
            />
          </TabsContent>

          <TabsContent value="generate">
            <TestGenerator
              functionality={selectedFunctionality}
              onTestGenerated={setGeneratedTest}
              onNext={() => setCurrentStep("execute")}
            />
          </TabsContent>

          <TabsContent value="execute">
            <TestExecutor generatedTest={generatedTest} functionality={selectedFunctionality} />
          </TabsContent>
        </Tabs>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                AI-Powered Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced AI analyzes your repository structure, identifies user-facing functionality, and extracts
                relevant selectors automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-green-500" />
                Smart Test Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generates comprehensive Cypress tests with proper setup, teardown, and dependency management for
                reliable test execution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-500" />
                Flexible Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Run tests in both headed and headless modes with automatic environment setup and detailed execution
                reporting.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
