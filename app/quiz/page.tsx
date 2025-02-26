"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ChevronRight, ChevronLeft } from "lucide-react"

type Option = {
  text: string
  snippet?: string
  correct: boolean
  explanation: string
}

type Question = {
  question: string
  snippet?: string
  options: Option[]
}

export default function TerraformQuiz() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/quiz/questions.json')
        if (!response.ok) {
          throw new Error(`Failed to load questions: ${response.statusText}`)
        }
        const data = await response.json()
        if (!data.questions || !Array.isArray(data.questions)) {
          throw new Error('Invalid questions data format')
        }
        setQuestions(data.questions)
        setLoading(false)
      } catch (error) {
        console.error('Error loading questions:', error)
        setError(error instanceof Error ? error.message : 'Failed to load questions')
        setLoading(false)
      }
    }

    loadQuestions()
  }, [])

  const handleSubmit = () => {
    if (selectedOption !== null) {
      setShowExplanation(true)
    }
  }

  const handleNext = () => {
    if (!questions.length) return
    setSelectedOption(null)
    setShowExplanation(false)
    setCurrentQuestion((prev) => (prev + 1) % questions.length)
  }

  const handlePrevious = () => {
    if (!questions.length) return
    setSelectedOption(null)
    setShowExplanation(false)
    setCurrentQuestion((prev) => (prev - 1 + questions.length) % questions.length)
  }

  if (loading) {
    return (
      <div className="container py-10">
        <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading questions...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl p-6">
          <div className="text-center">
            <p className="text-lg text-red-400">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="container py-10">
        <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl p-6">
          <div className="text-center">
            <p className="text-lg text-red-400">No questions available.</p>
          </div>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="container py-6">
      <Card className="w-full max-w-3xl mx-auto bg-gray-900 text-gray-100 shadow-xl">
        <CardHeader className="border-b border-gray-800 py-4">
          <CardTitle className="text-2xl font-bold text-blue-400">Terraform Quiz</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Test your Terraform and AWS infrastructure knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-blue-300">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <div className="text-xs font-medium text-gray-400">
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
            </div>
          </div>
          <p className="mb-4 text-base">{question.question}</p>
          {question.snippet && (
            <div className="mb-4">
              <SyntaxHighlighter
                language="hcl"
                style={vscDarkPlus}
                customStyle={{
                  backgroundColor: "#1E293B",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.8rem",
                }}
              >
                {question.snippet}
              </SyntaxHighlighter>
            </div>
          )}
          <RadioGroup
            value={selectedOption?.toString() || ""}
            onValueChange={(value: string) => setSelectedOption(Number.parseInt(value))}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div key={index}>
                <button
                  onClick={() => setSelectedOption(index)}
                  className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    selectedOption === index ? "bg-blue-900 border border-blue-500" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`} 
                    className="border-gray-600"
                    checked={selectedOption === index}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer text-sm">
                    {option.text}
                  </Label>
                </button>
                {option.snippet && (
                  <div className="mt-2 ml-7">
                    <SyntaxHighlighter
                      language="hcl"
                      style={vscDarkPlus}
                      customStyle={{
                        backgroundColor: "#1E293B",
                        padding: "0.75rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      {option.snippet}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
          <Button onClick={handlePrevious} variant="outline" className="bg-gray-800 hover:bg-gray-700 text-sm">
            <ChevronLeft className="mr-1 h-3 w-3" /> Previous
          </Button>
          <div className="w-20">
            {!showExplanation ? (
              <Button onClick={handleSubmit} disabled={selectedOption === null} className="bg-blue-600 hover:bg-blue-700 w-full text-sm">
                Submit
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 w-full text-sm">
                Next <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </CardFooter>
        {showExplanation && selectedOption !== null && (
          <div className="p-4 border-t border-gray-800">
            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p
                className={`font-semibold text-sm ${
                  question.options[selectedOption].correct ? "text-green-400" : "text-red-400"
                }`}
              >
                {question.options[selectedOption].correct ? "Correct!" : "Incorrect."}
              </p>
              <p className="mt-1 text-sm text-gray-300">{question.options[selectedOption].explanation}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

