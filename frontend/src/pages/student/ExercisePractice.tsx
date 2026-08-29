import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi'
import api from '../../services/api'
import HeartsRow from '../../components/ui/HeartsRow'

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
  hearts: number
  maxHearts: number
  heartsRegenAt: string | null
}

const formatRegenTime = (isoDate: string | null) => {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ExercisePractice() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<ExerciseData | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [outOfHearts, setOutOfHearts] = useState<{ heartsRegenAt: string | null } | null>(null)
  const [hearts, setHearts] = useState({ hearts: 5, maxHearts: 5 })

  useEffect(() => {
    if (!exerciseId) return
    api.get(`/exercises/${exerciseId}`)
      .then((response) => setExercise(response.data.data))
      .catch(() => toast.error('Exercise could not be loaded'))
      .finally(() => setLoading(false))

    api.get('/gamification/hearts')
      .then((response) => setHearts(response.data.data))
      .catch(() => {})
  }, [exerciseId])

  const handleSubmit = async () => {
    if (selected === null || !exercise) return
    try {
      const response = await api.post('/exercises/submit', { exerciseId: exercise._id, answer: selected })
      setResult(response.data.data)
      setHearts({ hearts: response.data.data.hearts, maxHearts: response.data.data.maxHearts })
    } catch (error: any) {
      if (error.response?.status === 403) {
        setOutOfHearts({ heartsRegenAt: error.response.data?.data?.heartsRegenAt || null })
        setHearts((prev) => ({ ...prev, hearts: 0 }))
        return
      }
      toast.error(error.response?.data?.message || 'Answer could not be submitted')
    }
  }

  if (loading) {
    return <div className="min-h-screen py-8 px-4 text-center">Loading exercise...</div>
  }

  if (!exercise) {
    return <div className="min-h-screen py-8 px-4 text-center">Exercise not found.</div>
  }

  if (outOfHearts) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <div className="container mx-auto max-w-md text-center">
          <div className="card p-8">
            <div className="mb-4 flex justify-center"><HeartsRow hearts={0} size={32} /></div>
            <h2 className="mb-2 text-2xl font-bold">You're out of hearts</h2>
            <p className="mb-6 text-[var(--text-muted)]">
              {outOfHearts.heartsRegenAt
                ? `Your next heart regenerates around ${formatRegenTime(outOfHearts.heartsRegenAt)}, or refill instantly with coins.`
                : 'Take a short break, or refill instantly with coins.'}
            </p>
            <button
              className="btn btn-primary mb-3 w-full"
              onClick={async () => {
                try {
                  const response = await api.post('/gamification/hearts/refill')
                  setHearts(response.data.data)
                  setOutOfHearts(null)
                  toast.success('Hearts refilled!')
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Not enough coins to refill hearts')
                }
              }}
            >
              Refill with coins
            </button>
            <button className="btn btn-outline w-full" onClick={() => navigate(-1)}>
              Back to lesson
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold">Exercise Practice</h1>
          </div>
          <HeartsRow hearts={hearts.hearts} maxHearts={hearts.maxHearts} />
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
                {result.isCorrect ? `Great job! You earned ${result.points} points.` : 'You lost a heart. Try the next one!'}
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
