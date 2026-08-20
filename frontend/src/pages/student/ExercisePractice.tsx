import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi'
import api from '../../services/api'

interface ExerciseData {
  _id: string
  question: string
  options?: string[]
  points: number
}

interface SubmitResult {
  isCorrect: boolean
  points: number
  correctAnswer: number
}

export default function ExercisePractice() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<ExerciseData | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!exerciseId) return
    api.get(`/exercises/${exerciseId}`)
      .then((response) => setExercise(response.data.data))
      .catch(() => toast.error('Exercise could not be loaded'))
      .finally(() => setLoading(false))
  }, [exerciseId])

  const handleSubmit = async () => {
    if (selected === null || !exercise) return
    try {
      const response = await api.post('/exercises/submit', { exerciseId: exercise._id, answer: selected })
      setResult(response.data.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Answer could not be submitted')
    }
  }

  if (loading) {
    return <div className="min-h-screen py-8 px-4 text-center">Loading exercise...</div>
  }

  if (!exercise) {
    return <div className="min-h-screen py-8 px-4 text-center">Exercise not found.</div>
  }

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
          <h1 className="text-3xl font-bold">Exercise Practice</h1>
        </div>

        {/* Exercise */}
        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">{exercise.question}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {(exercise.options || []).map((option, idx) => (
              <button
                key={idx}
                onClick={() => !result && setSelected(idx)}
                disabled={!!result}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                  selected === idx
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600'
                } ${
                  result
                    ? idx === result.correctAnswer
                      ? 'border-success bg-green-50 dark:bg-green-900/20 text-success'
                      : idx === selected
                      ? 'border-error bg-red-50 dark:bg-red-900/20 text-error'
                      : ''
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {result && idx === result.correctAnswer && (
                    <FiCheck className="text-success" size={20} />
                  )}
                  {result && idx === selected && idx !== result.correctAnswer && (
                    <FiX className="text-error" size={20} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {result && (
            <div
              className={`p-4 rounded-lg mb-8 ${
                result.isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 text-success'
                  : 'bg-red-50 dark:bg-red-900/20 text-error'
              }`}
            >
              <p className="font-bold">{result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
              <p className="text-sm mt-1">
                {result.isCorrect ? `Great job! You earned ${result.points} points.` : 'Try the next one!'}
              </p>
            </div>
          )}

          {/* Actions */}
          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className="w-full btn btn-primary"
            >
              Submit Answer
            </button>
          ) : (
            <button onClick={() => navigate(-1)} className="w-full btn btn-primary">
              Back to Lesson
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
