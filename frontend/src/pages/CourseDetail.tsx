import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useLearningStore } from '../store/learningStore'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { demoCourseMap } from '../data/demoCourses'
import { useI18n } from '../utils/i18n'
import { isDemoFallbackAllowed } from '../utils/runtimeMode'
import { hasActivePlan, isLessonFree } from '../utils/entitlement'
import { FiLock } from 'react-icons/fi'
import Seo from '../components/Seo'
import { getCourseSchema } from '../utils/structuredData'

const demoFallbackEnabled = () => isDemoFallbackAllowed()

interface CourseDetails {
  _id: string
  title: string
  description: string
  language: string
  level: string
  category: string
}

interface LessonSummary {
  _id: string
  title: string
  order: number
  duration?: number
  cefr?: string | null
}

interface SkillMasteryRow {
  skill: string
  attemptCount: number
  totalExercises: number
  state: string
}

interface LevelReadiness {
  ready: boolean
  reason: string
}

interface CourseMastery {
  completionPercentage: number
  masteryPercentage: number
  skills: SkillMasteryRow[]
  levelReadiness: Record<string, LevelReadiness>
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { enrollInCourse, myLearning } = useLearningStore()
  const { isAuthenticated, user } = useAuthStore()
  const { t } = useI18n()
  const [enrolling, setEnrolling] = useState(false)
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fallbackCourse = demoFallbackEnabled()
      ? (demoCourseMap[id] || Object.values(demoCourseMap).find((course) => course.title.toLowerCase().replace(/\s+/g, '-') === id))
      : undefined

    const loadCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`)
        const payload = response.data.data || response.data
        const resolvedCourse = payload?.course || fallbackCourse
        setCourse(resolvedCourse || null)
        setLessons(payload?.lessons || fallbackCourse?.lessons || [])
      } catch {
        if (fallbackCourse) {
          console.warn('PRODUCTION_FALLBACK_ATTEMPTED: course detail is using demo/staging fallback for a public course view')
          setCourse(fallbackCourse)
          setLessons(fallbackCourse.lessons || [])
        } else {
          toast.error('We\'re having trouble loading this course right now. Please retry or contact support.')
        }
      } finally {
        setLoading(false)
      }
    }

    if (fallbackCourse) {
      setCourse(fallbackCourse)
      setLessons(fallbackCourse.lessons || [])
      setLoading(false)
    }

    loadCourse()
  }, [id])

  // Check if student is already enrolled in this course
  const isEnrolled = myLearning.some(
    (item) => item.course?._id === id || (item.course as any) === id
  )

  const [mastery, setMastery] = useState<CourseMastery | null>(null)

  // Mastery only means something once the learner has actually engaged with the course - a
  // fresh visitor would otherwise see an all-zeros panel that looks like a bug, not a real state.
  useEffect(() => {
    if (!id || !isEnrolled) {
      setMastery(null)
      return
    }
    let cancelled = false
    api.get(`/certificates/mastery/${id}`)
      .then((response) => {
        if (!cancelled) setMastery(response.data.data)
      })
      .catch(() => {
        if (!cancelled) setMastery(null)
      })
    return () => {
      cancelled = true
    }
  }, [id, isEnrolled])

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error(t('courseDetail.loginRequired'))
      navigate('/login')
      return
    }

    if (!id) return

    setEnrolling(true)
    const success = await enrollInCourse(id)
    setEnrolling(false)

    if (success) {
      toast.success(t('courseDetail.enrollSuccess'))
      navigate('/my-learning')
    } else {
      toast.error(t('courseDetail.enrollFailed'))
    }
  }

  return (
    <div className="atlas-page">
      {course ? (
        <Seo
          title={course.title}
          description={course.description}
          path={`/courses/${course._id}`}
          jsonLd={getCourseSchema(course)}
        />
      ) : null}
      <div className="max-w-4xl mx-auto p-6">
      {loading ? <p>{t('common.loadingCourse')}</p> : null}
      {!loading && !course ? <p>{t('courseDetail.notFound')}</p> : null}
      {course ? <h1 className="mb-4 text-4xl font-bold text-ink">{course.title}</h1> : null}
      {/* Course metadata card */}
      {course ? <div className="atlas-panel mb-6 rounded-3xl p-6">
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted">
          <span className="rounded-full bg-[var(--border-light)] px-3 py-1">{course.language}</span>
          <span className="rounded-full bg-[var(--border-light)] px-3 py-1">{course.level}</span>
          <span className="rounded-full bg-[var(--border-light)] px-3 py-1">{course.category}</span>
        </div>
        <p className="mb-6 text-muted">{course.description}</p>

        <h2 className="mb-3 text-xl font-semibold text-ink">{t('courseDetail.lessons')}</h2>
        {lessons.length > 0 ? <div className="space-y-2 mb-6">
          {lessons.map((lesson) => {
            // Display-only: the real gate is server-side (getLessonById strips the content on
            // a locked lesson regardless of what this renders) - this just lets the student see
            // what's free before clicking in, rather than discovering it lesson by lesson.
            const gated = !isLessonFree(lesson) && !hasActivePlan(user?.billing)
            return (
              <button
                key={lesson._id}
                onClick={() => navigate(`/lesson/${lesson._id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-[var(--text-primary)] transition hover:border-primary-300 hover:bg-[var(--accent-light)]"
              >
                <span>{lesson.order}. {lesson.title}</span>
                {gated ? <FiLock className="flex-shrink-0 text-[var(--text-muted)]" size={14} aria-label={t('paywall.lockedLessonTitle')} /> : null}
              </button>
            )
          })}
        </div> : <p className="text-muted mb-6">{t('courseDetail.lessonsEmpty')}</p>}

        <div className="mb-6 rounded-2xl bg-[var(--surface-strong)] p-5 dark:bg-white/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">{t('courseDetail.blueprintKicker')}</p>
          <h3 className="mt-3 text-xl font-semibold text-ink dark:text-white">{t('courseDetail.blueprintHeading')}</h3>
          <p className="mt-2 text-sm text-muted">{t('courseDetail.blueprintGoal')}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 text-sm text-muted dark:border-white/10 dark:bg-white/5">
              {lessons.length === 1 ? t('courseDetail.lessonCount', { count: lessons.length }) : t('courseDetail.lessonCountPlural', { count: lessons.length })}
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4 text-sm text-muted dark:border-white/10 dark:bg-white/5">
              {t('courseDetail.pathOutcome')}
            </div>
          </div>
        </div>

        {isEnrolled ? (
          <button
            onClick={() => navigate('/my-learning')}
            className="btn px-6 py-3 font-semibold text-white"
            style={{ background: 'var(--success)' }}
          >
            {t('courseDetail.continueLearning')}
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="btn btn-primary px-6 py-3 font-semibold disabled:opacity-50"
          >
            {enrolling ? t('courseDetail.enrolling') : t('courseDetail.enroll')}
          </button>
        )}

        {isEnrolled && mastery ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 dark:bg-white/5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">{t('courseDetail.masteryKicker')}</p>
            <h3 className="mt-2 text-xl font-semibold text-ink dark:text-white">{t('courseDetail.masteryHeading')}</h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[var(--border-light)]/50 p-3 text-center">
                <strong className="block text-2xl text-ink dark:text-white">{mastery.completionPercentage}%</strong>
                <span className="text-xs text-muted">{t('courseDetail.masteryCompletion')}</span>
              </div>
              <div className="rounded-xl bg-[var(--border-light)]/50 p-3 text-center">
                <strong className="block text-2xl text-ink dark:text-white">{mastery.masteryPercentage}%</strong>
                <span className="text-xs text-muted">{t('courseDetail.masteryLevel')}</span>
              </div>
            </div>

            {Object.keys(mastery.levelReadiness || {}).length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(mastery.levelReadiness).map(([cefr, readiness]) => (
                  <span
                    key={cefr}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      readiness.ready
                        ? 'bg-[var(--success)]/15 text-[var(--success)]'
                        : 'bg-[var(--border-light)] text-muted'
                    }`}
                  >
                    {cefr}: {readiness.ready ? t('courseDetail.levelReady') : t('courseDetail.levelNotReady')}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {mastery.skills.filter((row) => row.totalExercises > 0).length > 0 ? (
                mastery.skills.filter((row) => row.totalExercises > 0).map((row) => (
                  <div key={row.skill} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink dark:text-white">{t(`skills.${row.skill}`)}</span>
                    <span className="text-xs text-muted">{t(`masteryStates.${row.state}`)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">{t('courseDetail.noSkillData')}</p>
              )}
            </div>
          </div>
        ) : null}
      </div> : null}
      </div>
    </div>
  )
}