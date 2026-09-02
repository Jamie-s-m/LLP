import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiVolume2, FiMic, FiEdit3, FiHelpCircle, FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLearningStore } from '../../store/learningStore'
import VideoEmbed from '../../components/ui/VideoEmbed'
import { track } from '../../utils/analytics'
import { useI18n } from '../../utils/i18n'

interface VocabItem {
  word: string
  translation: string
  pronunciation?: string
  examples?: string[]
}

interface GrammarItem {
  rule: string
  explanation: string
  examples?: string[]
}

interface ExerciseSummary {
  _id: string
  title: string
  type: string
  points: number
}

interface LessonData {
  _id: string
  title: string
  description?: string
  // Optional because a locked (paywalled) lesson's shell response omits these entirely -
  // see the `locked` state below, which is the real signal for which shape came back.
  content?: string
  course: string
  order: number
  difficulty?: string
  duration?: number
  vocabulary?: VocabItem[]
  grammar?: GrammarItem[]
  exercises?: ExerciseSummary[]
  contentType?: 'text' | 'video' | 'audio' | 'interactive'
  mediaUrl?: string
}

interface LessonListItem {
  _id: string
  title: string
  order: number
}

const EXERCISE_ICON: Record<string, typeof FiHelpCircle> = {
  multiple_choice: FiHelpCircle,
  fill_blank: FiEdit3,
  matching: FiEdit3,
  speaking: FiMic,
  writing: FiEdit3,
  listening: FiVolume2,
}

export default function LessonView() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { myLearning, fetchMyLearning, completeLesson } = useLearningStore()
  const { t } = useI18n()
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [locked, setLocked] = useState(false)
  const [siblings, setSiblings] = useState<LessonListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    fetchMyLearning()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!lessonId) return
    setLoading(true)
    setNotFound(false)

    api.get(`/lessons/${lessonId}`)
      .then(async (response) => {
        const data = response.data.data as LessonData
        const isLocked = Boolean(response.data.meta?.locked)
        setLesson(data)
        setLocked(isLocked)
        if (!isLocked) {
          track('lesson_started', { lessonId: data._id, courseId: data.course })
        }
        try {
          const listRes = await api.get('/lessons', { params: { courseId: data.course } })
          setSiblings(listRes.data.data || [])
        } catch {
          setSiblings([])
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [lessonId])

  const progressRecord = myLearning.find((item) => (item.course?._id || item.course) === lesson?.course)
  const isCompleted = !!lesson && !!progressRecord?.completedLessons?.some((id: any) => (id?._id || id) === lesson._id)
  const currentIndex = siblings.findIndex((item) => item._id === lessonId)
  const previousLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  const handleComplete = async () => {
    if (!lesson || isCompleted) return
    setCompleting(true)
    const success = await completeLesson(lesson.course, lesson._id)
    setCompleting(false)
    if (success) {
      track('lesson_completed', { lessonId: lesson._id, courseId: lesson.course })
      toast.success('Lesson marked complete — nice work!')
    } else {
      toast.error('Could not save your progress. Are you enrolled in this course?')
    }
  }

  if (loading) {
    return <div className="atlas-page px-4 py-12 text-center"><div className="mx-auto max-w-2xl atlas-panel p-6 text-muted">Loading lesson...</div></div>
  }

  if (notFound || !lesson) {
    return (
      <div className="atlas-page px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl atlas-panel p-6 text-muted">
          Lesson not found. <Link to="/my-learning" className="text-[var(--accent)] font-semibold">Back to My Learning</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 px-3 sm:px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">{lesson.title}</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {lesson.difficulty || 'Easy'} · {lesson.duration ? `${lesson.duration} min` : 'Self-paced'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {locked ? (
              <div className="card flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
                  <FiLock size={24} />
                </div>
                <h2 className="text-xl font-semibold">{t('paywall.lockedLessonTitle')}</h2>
                <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">{t('paywall.lockedLessonCopy')}</p>
                <Link to="/pricing" className="btn btn-primary mt-2">{t('paywall.viewPlans')}</Link>
              </div>
            ) : (
              <>
                {lesson.contentType === 'video' && lesson.mediaUrl ? (
                  <VideoEmbed url={lesson.mediaUrl} title={lesson.title} />
                ) : null}
                {lesson.contentType === 'audio' && lesson.mediaUrl ? (
                  <audio controls className="mb-8 w-full" src={lesson.mediaUrl}>
                    Your browser does not support embedded audio.
                  </audio>
                ) : null}

                <div className="card mb-8">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3">Overview</h2>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 mb-2">
                      {lesson.description}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{lesson.content}</p>
                  </div>
                </div>

                {lesson.vocabulary && lesson.vocabulary.length > 0 ? (
                  <div className="card mb-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3">New Vocabulary</h3>
                    <div className="space-y-3">
                      {lesson.vocabulary.map((item, idx) => (
                        <div key={idx} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-base sm:text-lg font-semibold">{item.word}</p>
                              {item.pronunciation ? <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">{item.pronunciation}</p> : null}
                            </div>
                            <FiVolume2 size={18} className="text-primary-500" />
                          </div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{item.translation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {lesson.grammar && lesson.grammar.length > 0 ? (
                  <div className="card mb-8">
                    <h3 className="text-xl font-bold mb-4">Grammar</h3>
                    {lesson.grammar.map((item, idx) => (
                      <div key={idx} className="mb-4 last:mb-0">
                        <p className="text-neutral-700 dark:text-neutral-300 mb-2">{item.explanation}</p>
                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                          <p className="font-mono text-primary-700 dark:text-primary-300">{item.rule}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {lesson.exercises && lesson.exercises.length > 0 ? (
                  <div className="card mb-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3">Practice</h3>
                    <div className="space-y-3">
                      {lesson.exercises.map((exercise) => {
                        const Icon = EXERCISE_ICON[exercise.type] || FiHelpCircle
                        return (
                          <Link
                            key={exercise._id}
                            to={`/exercise/${exercise._id}`}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 transition hover:border-primary-300 dark:border-neutral-700"
                          >
                            <span className="flex items-center gap-3">
                              <Icon size={18} className="text-primary-500" />
                              <span className="font-medium">{exercise.title}</span>
                            </span>
                            <span className="text-sm text-neutral-500">+{exercise.points} pts</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="card">
                  <button
                    onClick={handleComplete}
                    disabled={completing || isCompleted}
                    className={`w-full btn ${isCompleted ? 'btn-ghost' : 'btn-primary'} flex items-center justify-center gap-2 disabled:opacity-70`}
                  >
                    {isCompleted && <FiCheckCircle size={18} />}
                    {isCompleted ? 'Completed ✓' : completing ? 'Saving...' : 'Mark as Completed'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="font-bold mb-4">Course Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Overall</span>
                    <span>{progressRecord?.progressPercentage ?? 0}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${progressRecord?.progressPercentage ?? 0}%` }} />
                  </div>
                </div>
              </div>
              <hr className="my-6 border-neutral-200 dark:border-neutral-700" />
              <div className="space-y-3">
                <button
                  onClick={() => previousLesson && navigate(`/lesson/${previousLesson._id}`)}
                  disabled={!previousLesson}
                  className="w-full btn btn-outline text-left disabled:opacity-40"
                >
                  ← Previous Lesson
                </button>
                <button
                  onClick={() => nextLesson && navigate(`/lesson/${nextLesson._id}`)}
                  disabled={!nextLesson}
                  className="w-full btn btn-primary text-left disabled:opacity-40"
                >
                  Next Lesson →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
