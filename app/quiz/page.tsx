"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ChevronRight, ChevronLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react"

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

type Answer = {
  selectedOption: number | null
  isCorrect: boolean
}

export default function TerraformQuiz() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('quizState')
    if (savedState) {
      const { currentQuestion, answers, quizCompleted } = JSON.parse(savedState)
      setCurrentQuestion(currentQuestion)
      setAnswers(answers)
      setQuizCompleted(quizCompleted)
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (answers.length > 0) {
      localStorage.setItem('quizState', JSON.stringify({
        currentQuestion,
        answers,
        quizCompleted
      }))
    }
  }, [currentQuestion, answers, quizCompleted])

  // Add browser history support
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        const { currentQuestion, quizCompleted } = event.state
        setCurrentQuestion(currentQuestion)
        setQuizCompleted(quizCompleted)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Update history when navigating
  useEffect(() => {
    window.history.pushState(
      { currentQuestion, quizCompleted },
      '',
      `?q=${currentQuestion}${quizCompleted ? '&completed=true' : ''}`
    )
  }, [currentQuestion, quizCompleted])

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
        
        // Only initialize answers if there's no saved state
        if (!localStorage.getItem('quizState')) {
          const initialAnswers = new Array(data.questions.length).fill({ selectedOption: null, isCorrect: false })
          setAnswers(initialAnswers)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading questions:', error)
        setError(error instanceof Error ? error.message : 'Failed to load questions')
        setLoading(false)
      }
    }

    loadQuestions()
  }, [])

  useEffect(() => {
    if (!answers.length) return
    const currentAnswer = answers[currentQuestion]
    if (currentAnswer) {
      setSelectedOption(currentAnswer.selectedOption)
      setShowExplanation(currentAnswer.selectedOption !== null)
    }
  }, [currentQuestion, answers])

  const handleSubmit = () => {
    if (selectedOption !== null) {
      const isCorrect = questions[currentQuestion].options[selectedOption].correct
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = { selectedOption, isCorrect }
      setAnswers(newAnswers)
      setShowExplanation(true)
    }
  }

  const handleNext = () => {
    if (!questions.length) return
    if (currentQuestion === questions.length - 1) {
      // Only complete if all questions are answered
      const allAnswered = answers.every(answer => answer.selectedOption !== null)
      if (allAnswered) {
        setQuizCompleted(true)
      }
    } else {
      setCurrentQuestion((prev) => (prev + 1) % questions.length)
    }
  }

  const handlePrevious = () => {
    if (!questions.length || currentQuestion === 0) return
    setCurrentQuestion((prev) => prev - 1)
  }

  const calculateScore = () => {
    const correctAnswers = answers.filter(answer => answer.isCorrect).length
    return {
      score: correctAnswers,
      total: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedOption(null)
    setShowExplanation(false)
    setQuizCompleted(false)
    setAnswers(new Array(questions.length).fill({ selectedOption: null, isCorrect: false }))
  }

  const handleReset = () => {
    const confirmed = window.confirm('Are you sure you want to reset your progress? This cannot be undone.')
    if (confirmed) {
      localStorage.removeItem('quizState')
      setCurrentQuestion(0)
      setSelectedOption(null)
      setShowExplanation(false)
      setQuizCompleted(false)
      setAnswers(new Array(questions.length).fill({ selectedOption: null, isCorrect: false }))
    }
  }

  const handleQuestionClick = (index: number) => {
    setQuizCompleted(false)
    setCurrentQuestion(index)
  }

  if (loading) {
    return (
      <div className="container py-6">
        <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-base">Loading questions...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-6">
        <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl p-4">
          <div className="text-center">
            <p className="text-base text-red-400">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="container py-6">
        <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl p-4">
          <div className="text-center">
            <p className="text-base text-red-400">No questions available.</p>
          </div>
        </Card>
      </div>
    )
  }

  if (quizCompleted) {
    const { score, total, percentage } = calculateScore()
    return (
      <div className="container py-6">
        <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl">
          <CardHeader className="border-b border-gray-800 py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-blue-400">Quiz Completed!</CardTitle>
              <div className="flex space-x-2">
                <Button onClick={() => setQuizCompleted(true)} variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700">
                  <ChevronLeft className="h-3 w-3 mr-1" /> Results
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700">
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
              </div>
            </div>
            <CardDescription className="text-xs text-gray-400">
              Here's how you did on the Terraform quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-blue-400 mb-1">{percentage}%</p>
              <p className="text-sm text-gray-400">You got {score} out of {total} questions correct</p>
            </div>
            <div className="space-y-2">
              {questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(index)}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left"
                >
                  {answers[index].isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-grow min-w-0">
                    <span className="text-xs font-medium block">Question {index + 1}</span>
                    <p className="text-xs text-gray-400 line-clamp-2 break-words mt-0.5">{question.question}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-800 pt-3">
            <Button onClick={restartQuiz} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Restart Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const { score, total, percentage } = calculateScore()

  // Update the main quiz view's footer to include a "Review All" button when all questions are answered
  const allAnswered = answers.every(answer => answer.selectedOption !== null)

  return (
    <div className="container py-6">
      <Card className="w-full max-w-4xl mx-auto bg-gray-900 text-gray-100 shadow-xl">
        <CardHeader className="border-b border-gray-800 py-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-blue-400">Terraform Quiz</CardTitle>
            <Button onClick={handleReset} variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700">
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          </div>
          <CardDescription className="text-xs text-gray-400">
            Test your Terraform and AWS infrastructure knowledge
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-blue-300">
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <div className="text-xs font-medium text-gray-400">
              Current Score: {score}/{total} ({percentage}%)
            </div>
          </div>
          <div className="mb-3 h-1 bg-gray-800 rounded-full">
            <div 
              className="h-1 bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="mb-3 text-sm">{question.question}</p>
          {question.snippet && (
            <div className="mb-3">
              <SyntaxHighlighter
                language="hcl"
                style={vscDarkPlus}
                customStyle={{
                  backgroundColor: "#1E293B",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.75rem",
                }}
              >
                {question.snippet}
              </SyntaxHighlighter>
            </div>
          )}
          <RadioGroup
            value={selectedOption?.toString() || ""}
            onValueChange={(value: string) => setSelectedOption(Number.parseInt(value))}
            className="space-y-2"
          >
            {question.options.map((option, index) => (
              <div key={index}>
                <button
                  onClick={() => setSelectedOption(index)}
                  className={`w-full text-left flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    selectedOption === index ? "bg-blue-900 border border-blue-500" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`} 
                    className="border-gray-600"
                    checked={selectedOption === index}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer text-xs">
                    {option.text}
                  </Label>
                </button>
                {option.snippet && (
                  <div className="mt-2 ml-6">
                    <SyntaxHighlighter
                      language="hcl"
                      style={vscDarkPlus}
                      customStyle={{
                        backgroundColor: "#1E293B",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
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
        <CardFooter className="flex justify-between border-t border-gray-800 pt-3">
          <Button onClick={handlePrevious} variant="outline" size="sm" className="bg-gray-800 hover:bg-gray-700">
            <ChevronLeft className="mr-1 h-3 w-3" /> Previous
          </Button>
          <div className="flex space-x-2">
            {allAnswered && !showExplanation && (
              <Button
                onClick={() => setQuizCompleted(true)}
                size="sm"
                variant="outline"
                className="bg-gray-800 hover:bg-gray-700"
              >
                Review All
              </Button>
            )}
            {!showExplanation ? (
              <Button onClick={handleSubmit} disabled={selectedOption === null} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Submit
              </Button>
            ) : (
              <Button onClick={handleNext} size="sm" className="bg-blue-600 hover:bg-blue-700">
                {currentQuestion === questions.length - 1 && allAnswered ? "Finish" : "Next"} <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </CardFooter>
        {showExplanation && selectedOption !== null && (
          <div className="p-3 border-t border-gray-800">
            <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
              <p
                className={`font-semibold text-xs ${
                  question.options[selectedOption].correct ? "text-green-400" : "text-red-400"
                }`}
              >
                {question.options[selectedOption].correct ? "Correct!" : "Incorrect."}
              </p>
              <p className="mt-1 text-xs text-gray-300">{question.options[selectedOption].explanation}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

