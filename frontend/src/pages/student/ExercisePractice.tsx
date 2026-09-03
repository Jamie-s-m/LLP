import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiLock } from 'react-icons/fi'
import api from '../../services/api'
import HeartsRow from '../../components/ui/HeartsRow'
import { useI18n } from '../../utils/i18n'
import ExerciseRunner, { type ExerciseData } from '../../components/lesson/ExerciseRunner'

const formatRegenTime = (isoDate: string | null) => {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Standalone route for a direct/bookmarked link to one exercise (e.g. from a notification).
// The primary path is now the in-lesson practice flow in LessonView.tsx, which renders the
// same ExerciseRunner inline as one step in a sequence - this page is a thin wrapper around
// it so exercise-type rendering has exactly one implementation, not two that can drift apart.
export default function ExercisePractice() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [exercise, setExercise] = useState<ExerciseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [outOfHearts, setOutOfHearts] = useState<{ heartsRegenAt: string | null } | null>(null)
  const [hearts, setHearts] = useState({ hearts: 5, maxHearts: 5 })
  const [refillingHearts, setRefillingHearts] = useState(false)

  useEffect(() => {
    if (!exerciseId) return
    api.get(`/exercises/${exerciseId}`)
      .then((response) => {
        setExercise(response.data.data)
        setLocked(Boolean(response.data.meta?.locked))
      })
      .catch(() => toast.error('Exercise could not be loaded'))
      .finally(() => setLoading(false))

    api.get('/gamification/hearts')
      .then((response) => setHearts(response.data.data))
      .catch(() => undefined)
  }, [exerciseId])

  if (loading) {
    return <div className="min-h-screen py-8 px-4 text-center">Loading exercise...</div>
  }

  if (!exercise) {
    return <div className="min-h-screen py-8 px-4 text-center">Exercise not found.</div>
  }

  if (locked) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <div className="container mx-auto max-w-md text-center">
          <div className="card flex flex-col items-center gap-4 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
              <FiLock size={24} />
            </div>
            <h2 className="text-2xl font-bold">{t('paywall.lockedExerciseTitle')}</h2>
            <p className="text-[var(--text-muted)]">{t('paywall.lockedExerciseCopy')}</p>
            <Link to="/pricing" className="btn btn-primary w-full">{t('paywall.viewPlans')}</Link>
            <button className="btn btn-outline w-full" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (outOfHearts) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
        <div className="container mx-auto max-w-md text-center">
          <div className="card p-8">
            <div className="mb-4 flex justify-center"><HeartsRow hearts={0} size={32} /></div>
            <h2 className="mb-2 text-2xl font-bold">You&apos;re out of hearts</h2>
            <p className="mb-6 text-[var(--text-muted)]">
              {outOfHearts.heartsRegenAt
                ? `Your next heart regenerates around ${formatRegenTime(outOfHearts.heartsRegenAt)}, or refill instantly with coins.`
                : 'Take a short break, or refill instantly with coins.'}
            </p>
            <button
              className="btn btn-primary mb-3 w-full disabled:opacity-50"
              disabled={refillingHearts}
              onClick={async () => {
                setRefillingHearts(true)
                try {
                  const response = await api.post('/gamification/hearts/refill')
                  setHearts(response.data.data)
                  setOutOfHearts(null)
                  toast.success('Hearts refilled!')
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Not enough coins to refill hearts')
                } finally {
                  setRefillingHearts(false)
                }
              }}
            >
              {refillingHearts ? 'Refilling...' : 'Refill with coins'}
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
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Exercise Practice</h1>
        </div>

        <div className="card">
          <ExerciseRunner
            exercise={exercise}
            hearts={hearts}
            onHeartsChange={setHearts}
            onOutOfHearts={(heartsRegenAt) => setOutOfHearts({ heartsRegenAt })}
            onDone={() => navigate(-1)}
          />
        </div>
      </div>
    </div>
  )
}
