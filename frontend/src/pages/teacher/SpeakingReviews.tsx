import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheck, FiX } from 'react-icons/fi'
import api from '../../services/api'

interface ReviewItem {
  _id: string
  audioSubmission: string
  writtenSubmission?: string
  createdAt: string
  user: { firstName: string; lastName: string; email: string }
  exercise: { question: string; points: number; instructions?: string; lesson?: { title: string; course?: { title: string } } }
}

export default function SpeakingReviews() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [reviewing, setReviewing] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.get('/exercises/reviews/speaking')
      .then((response) => setItems(response.data.data))
      .catch(() => toast.error('Speaking submissions could not be loaded'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleReview = async (attemptId: string, isCorrect: boolean) => {
    setReviewing(attemptId)
    try {
      await api.post(`/exercises/reviews/speaking/${attemptId}`, { isCorrect, feedback: feedback[attemptId] || '' })
      setItems((current) => current.filter((item) => item._id !== attemptId))
      toast.success(isCorrect ? 'Marked correct — points awarded' : 'Marked incorrect')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Review could not be saved')
    } finally {
      setReviewing(null)
    }
  }

  return (
    <div className="atlas-page px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="atlas-heading mb-8">
          <p className="atlas-kicker">Content operations</p>
          <h1>Speaking Reviews</h1>
          <p>Listen to student recordings and grade them. Approving awards the exercise&apos;s points immediately.</p>
        </div>

        {loading ? (
          <div className="atlas-panel p-6 text-muted">Loading submissions...</div>
        ) : items.length === 0 ? (
          <div className="atlas-panel p-6 text-muted">No pending speaking submissions. Nice — you&apos;re caught up.</div>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <div key={item._id} className="atlas-panel p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink dark:text-white">{item.user.firstName} {item.user.lastName}</p>
                    <p className="text-xs text-muted">{item.exercise.lesson?.course?.title} • {item.exercise.lesson?.title}</p>
                  </div>
                  <span className="text-sm text-muted">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="mb-3 font-medium text-ink dark:text-white">{item.exercise.question}</p>
                {item.writtenSubmission ? (
                  <p className="mb-4 whitespace-pre-wrap rounded-xl bg-[var(--surface-strong)] p-4 text-sm text-ink dark:bg-white/5 dark:text-white">
                    {item.writtenSubmission}
                  </p>
                ) : (
                  <audio controls src={item.audioSubmission} className="w-full mb-4" />
                )}
                <label className="sr-only" htmlFor={`speaking-feedback-${item._id}`}>Feedback for {item.user.firstName} {item.user.lastName}</label>
                <textarea
                  id={`speaking-feedback-${item._id}`}
                  className="input min-h-16 mb-3"
                  placeholder="Optional feedback for the student..."
                  value={feedback[item._id] || ''}
                  onChange={(e) => setFeedback((current) => ({ ...current, [item._id]: e.target.value }))}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(item._id, true)}
                    disabled={reviewing === item._id}
                    className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
                  >
                    <FiCheck size={18} /> Correct (+{item.exercise.points} pts)
                  </button>
                  <button
                    onClick={() => handleReview(item._id, false)}
                    disabled={reviewing === item._id}
                    className="btn btn-outline flex-1 inline-flex items-center justify-center gap-2"
                  >
                    <FiX size={18} /> Needs work
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
