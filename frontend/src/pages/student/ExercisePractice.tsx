import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi'

export default function ExercisePractice() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(string | number)[]>([])
  const [submitted, setSubmitted] = useState(false)

  const exercises = [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What is the English word for "hello"?',
      options: ['goodbye', 'hello', 'thanks', 'please'],
      correctAnswer: 1,
      points: 10,
    },
    {
      id: 2,
      type: 'fill_blank',
      question: 'I ___ English.',
      options: ['speak', 'am speaking', 'do speak'],
      correctAnswer: 0,
      points: 10,
    },
  ]

  const exercise = exercises[0]

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const handleNext = () => {
    if (currentQuestion < exercises.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSubmitted(false)
    }
  }

  const isCorrect = submitted && answers[currentQuestion] === exercise.correctAnswer

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Exercise {exerciseId || 'Practice'}</h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span>Question {currentQuestion + 1} of {exercises.length}</span>
            <span>{Math.round(((currentQuestion + 1) / exercises.length) * 100)}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Exercise */}
        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">{exercise.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {exercise.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => !submitted && handleAnswerSelect(idx)}
                disabled={submitted}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                  answers[currentQuestion] === idx
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600'
                } ${
                  submitted
                    ? idx === exercise.correctAnswer
                      ? 'border-success bg-green-50 dark:bg-green-900/20 text-success'
                      : idx === answers[currentQuestion]
                      ? 'border-error bg-red-50 dark:bg-red-900/20 text-error'
                      : ''
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {submitted && idx === exercise.correctAnswer && (
                    <FiCheck className="text-success" size={20} />
                  )}
                  {submitted && idx === answers[currentQuestion] && idx !== exercise.correctAnswer && (
                    <FiX className="text-error" size={20} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {submitted && (
            <div
              className={`p-4 rounded-lg mb-8 ${
                isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 text-success'
                  : 'bg-red-50 dark:bg-red-900/20 text-error'
              }`}
            >
              <p className="font-bold">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
              <p className="text-sm mt-1">
                {isCorrect ? `Great job! You earned ${exercise.points} points.` : 'Try again!'}
              </p>
            </div>
          )}

          {/* Actions */}
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={answers[currentQuestion] === undefined}
              className="w-full btn btn-primary"
            >
              Submit Answer
            </button>
          ) : (
            <button onClick={handleNext} className="w-full btn btn-primary">
              {currentQuestion === exercises.length - 1 ? 'Finish' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
