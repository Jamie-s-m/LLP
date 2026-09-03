import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiVolume2, FiHelpCircle, FiLock, FiMic, FiEdit3 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLearningStore } from '../../store/learningStore'
import VideoEmbed from '../../components/ui/VideoEmbed'
import ProgressBar from '../../components/ui/ProgressBar'
import { track } from '../../utils/analytics'
import { useI18n } from '../../utils/i18n'
import { BadgeIcon } from '../../utils/badgeIcons'
import Illustration from '../../components/illustrations/Illustration'
import ExerciseRunner, { type ExerciseData } from '../../components/lesson/ExerciseRunner'

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

type Phase = 'learn' | 'practice' | 'complete'

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
  const [completionUnlocks, setCompletionUnlocks] = useState<Array<{ name: string; icon?: string }>>([])

  const [phase, setPhase] = useState<Phase>('learn')
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [currentExercise, setCurrentExercise] = useState<ExerciseData | null>(null)
  const [exerciseLoading, setExerciseLoading] = useState(false)
  const [hearts, setHearts] = useState({ hearts: 5, maxHearts: 5 })
  const [outOfHearts, setOutOfHearts] = useState<{ heartsRegenAt: string | null } | null>(null)
  const [refillingHearts, setRefillingHearts] = useState(false)

  useEffect(() => {
    fetchMyLearning()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!lessonId) return
    setLoading(true)
    setNotFound(false)
    setPhase('learn')
    setPracticeIndex(0)
    setCompletionUnlocks([])

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

  const exercises = lesson?.exercises || []

  // Fetch each practice step's full exercise data lazily as the learner reaches it - the
  // lesson payload only carries summaries ({_id, title, type, points}), same as before.
  useEffect(() => {
    if (phase !== 'practice') return
    const summary = exercises[practiceIndex]
    if (!summary) return
    setExerciseLoading(true)
    setCurrentExercise(null)
    api.get(`/exercises/${summary._id}`)
      .then((response) => setCurrentExercise(response.data.data))
      .catch(() => toast.error('Exercise could not be loaded'))
      .finally(() => setExerciseLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, practiceIndex, lesson?._id])

  useEffect(() => {
    if (phase !== 'practice') return
    api.get('/gamification/hearts').then((response) => setHearts(response.data.data)).catch(() => undefined)
  }, [phase])

  const progressRecord = myLearning.find((item) => (item.course?._id || item.course) === lesson?.course)
  const isCompleted = !!lesson && !!progressRecord?.completedLessons?.some((id: any) => (id?._id || id) === lesson._id)
  const currentIndex = siblings.findIndex((item) => item._id === lessonId)
  const previousLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextLesson = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  const handleComplete = async () => {
    if (!lesson || isCompleted) {
      setPhase('complete')
      return
    }
    setCompleting(true)
    const { success, unlockedBadges } = await completeLesson(lesson.course, lesson._id)
    setCompleting(false)
    if (success) {
      track('lesson_completed', { lessonId: lesson._id, courseId: lesson.course })
      setCompletionUnlocks(unlockedBadges)
      setPhase('complete')
    } else {
      toast.error('Could not save your progress. Are you enrolled in this course?')
    }
  }

  const advancePractice = () => {
    if (practiceIndex < exercises.length - 1) {
      setPracticeIndex((i) => i + 1)
    } else {
      handleComplete()
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

  // Stepper labels: Learn -> one dot per exercise -> Complete. Kept even when there are zero
  // exercises (Learn -> Complete) so the "where am I" signal never disappears.
  const steps: Array<{ key: string; label: string; active: boolean; done: boolean }> = [
    { key: 'learn', label: 'Learn', active: phase === 'learn', done: phase !== 'learn' },
    ...exercises.map((ex, i) => ({
      key: ex._id,
      label: `${i + 1}`,
      active: phase === 'practice' && practiceIndex === i,
      done: phase === 'complete' || (phase === 'practice' && practiceIndex > i),
    })),
    { key: 'complete', label: 'Done', active: phase === 'complete', done: false },
  ]

  return (
    <div className="py-6 px-3 sm:px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
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

        {!locked ? (
          <ol className="mb-6 flex items-center gap-2" aria-label="Lesson progress">
            {steps.map((step) => (
              <li key={step.key} className="flex items-center gap-2">
                <span
                  className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${
                    step.done ? 'bg-[var(--success)] text-white' : step.active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--border-light)] text-[var(--text-subtle)]'
                  }`}
                >
                  {step.done ? <FiCheckCircle size={14} aria-hidden="true" /> : step.label}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        <div className={`grid grid-cols-1 gap-6 lg:gap-8 ${phase === 'practice' ? '' : 'lg:grid-cols-3'}`}>
          {/* Main Content */}
          <div className={phase === 'practice' ? '' : 'lg:col-span-2'}>
            {locked ? (
              <div className="card flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
                  <FiLock size={24} />
                </div>
                <h2 className="text-xl font-semibold">{t('paywall.lockedLessonTitle')}</h2>
                <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">{t('paywall.lockedLessonCopy')}</p>
                <Link to="/pricing" className="btn btn-primary mt-2">{t('paywall.viewPlans')}</Link>
              </div>
            ) : phase === 'learn' ? (
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

                {exercises.length > 0 ? (
                  <div className="card mb-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3">Practice</h3>
                    <div className="space-y-3">
                      {exercises.map((exercise) => {
                        const Icon = EXERCISE_ICON[exercise.type] || FiHelpCircle
                        return (
                          <div key={exercise._id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
                            <span className="flex items-center gap-3">
                              <Icon size={18} className="text-primary-500" />
                              <span className="font-medium">{exercise.title}</span>
                            </span>
                            <span className="text-sm text-neutral-500">+{exercise.points} pts</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="card">
                  <button
                    onClick={() => (exercises.length > 0 ? setPhase('practice') : handleComplete())}
                    disabled={completing}
                    className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {exercises.length > 0 ? 'Start Practice' : completing ? 'Saving...' : 'Mark as Completed'}
                  </button>
                </div>
              </>
            ) : phase === 'practice' ? (
              <div className="mx-auto max-w-2xl">
                {outOfHearts ? (
                  <div className="card p-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold">You&apos;re out of hearts</h2>
                    <p className="mb-6 text-[var(--text-muted)]">
                      {outOfHearts.heartsRegenAt
                        ? `Your next heart regenerates around ${new Date(outOfHearts.heartsRegenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, or refill instantly with coins.`
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
                    <button className="btn btn-outline w-full" onClick={() => setPhase('learn')}>
                      Back to lesson content
                    </button>
                  </div>
                ) : exerciseLoading || !currentExercise ? (
                  <div className="card p-8 text-center text-muted">Loading exercise...</div>
                ) : (
                  <div className="card p-6">
                    <ExerciseRunner
                      key={currentExercise._id}
                      exercise={currentExercise}
                      hearts={hearts}
                      onHeartsChange={setHearts}
                      onOutOfHearts={(heartsRegenAt) => setOutOfHearts({ heartsRegenAt })}
                      onDone={advancePractice}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto max-w-xl text-center">
                <div className="card p-8">
                  <div className="mx-auto mb-4 h-32 w-32">
                    <Illustration name="celebration" className="h-full w-full" />
                  </div>
                  <h2 className="mb-2 text-h1 text-ink dark:text-white">Lesson complete!</h2>
                  <p className="mb-6 text-muted">
                    {exercises.length > 0
                      ? `You worked through ${exercises.length} exercise${exercises.length === 1 ? '' : 's'} in "${lesson.title}".`
                      : `Nice work finishing "${lesson.title}".`}
                  </p>
                  {completionUnlocks.length > 0 ? (
                    <div className="mb-6 space-y-2">
                      {completionUnlocks.map((badge) => (
                        <div key={badge.name} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-light)] p-3 text-[var(--accent)]">
                          {badge.icon ? <BadgeIcon iconKey={badge.icon} className="text-xl" /> : null}
                          <span className="font-semibold">Badge unlocked: {badge.name}!</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      onClick={() => nextLesson && navigate(`/lesson/${nextLesson._id}`)}
                      disabled={!nextLesson}
                      className="btn btn-primary disabled:opacity-40"
                    >
                      {nextLesson ? 'Next Lesson →' : 'You reached the end of this course'}
                    </button>
                    <Link to="/my-learning" className="btn btn-outline">Back to My Learning</Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - hidden during practice to keep the exercise focused and distraction-free */}
          {phase !== 'practice' ? (
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="font-bold mb-4">Course Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>Overall</span>
                      <span>{progressRecord?.progressPercentage ?? 0}%</span>
                    </div>
                    <ProgressBar value={progressRecord?.progressPercentage ?? 0} />
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
          ) : null}
        </div>
      </div>
    </div>
  )
}
