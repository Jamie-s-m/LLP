import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiBookOpen, FiCheckCircle, FiMessageCircle, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi'
import { BRAND } from '../config/brand'
import { useLearningStore } from '../store/learningStore'
import { useI18n } from '../utils/i18n'

export default function Home() {
  const { courses, fetchCourses, isLoading, error } = useLearningStore()
  const { t } = useI18n()

  useEffect(() => {
    fetchCourses({ limit: 6 })
  }, [fetchCourses])

  const safeCourses = Array.isArray(courses) ? courses : []
  const goalCards = [
    { title: t('home.goal1Title'), copy: t('home.goal1Copy'), href: '/courses?category=Conversation' },
    { title: t('home.goal2Title'), copy: t('home.goal2Copy'), href: '/courses?level=Intermediate' },
    { title: t('home.goal3Title'), copy: t('home.goal3Copy'), href: '/register?role=parent' },
  ]
  const workflowSteps = [
    { title: t('home.step1Title'), copy: t('home.step1Copy'), icon: FiBookOpen },
    { title: t('home.step2Title'), copy: t('home.step2Copy'), icon: FiTrendingUp },
    { title: t('home.step3Title'), copy: t('home.step3Copy'), icon: FiUsers },
  ]
  const platformSignals = [
    { title: t('home.signal1Title'), copy: t('home.signal1Copy'), icon: FiCheckCircle },
    { title: t('home.signal2Title'), copy: t('home.signal2Copy'), icon: FiMessageCircle },
    { title: t('home.signal3Title'), copy: t('home.signal3Copy'), icon: FiShield },
  ]
  const quickAccessCards = [
    { label: 'Courses', href: '/courses', accent: 'bg-primary-100' },
    { label: 'Tutors', href: '/tutors', accent: 'bg-secondary-100' },
    { label: 'Practice', href: '/flashcards', accent: 'bg-accent-100' },
    { label: 'Chat', href: '/chat', accent: 'bg-coral-100' },
  ]

  return (
    <div className="atlas-page">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="atlas-hero mb-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              {BRAND.displayName}
            </div>
            <p className="atlas-kicker">{t('home.heroKicker')}</p>
            <h1 className="mb-4 text-4xl font-extrabold tracking-[-0.06em] md:text-5xl lg:text-6xl">
              {BRAND.tagline}
            </h1>
            <p className="mb-2 max-w-2xl text-sm font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              The language nest concept
            </p>
            <p className="mb-8 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
              {BRAND.concept}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/courses"
                className="btn btn-primary px-8 py-3.5 text-base"
              >
                {t('home.exploreLearningPaths')}
              </Link>
              <Link
                to="/tutors"
                className="btn btn-secondary px-8 py-3.5 text-base"
              >
                Find your tutor
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-sm text-[var(--text-muted)]">
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5">Live tutoring</span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5">AI practice</span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-1.5">Progress tracking</span>
            </div>
          </div>
          <div className="hero-orbit-wrap relative flex items-center justify-center">
            <span className="hero-float hero-float-one" />
            <span className="hero-float hero-float-two" />
            <span className="hero-float hero-float-three" />
            <span className="hero-float hero-float-four" />
            <img src={`${import.meta.env.BASE_URL}linguanest-orbit.svg`} alt="LinguaNest premium language learning illustration" className="hero-orbit-image drop-shadow-[0_18px_40px_rgba(15,23,42,0.14)]" />
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickAccessCards.map((card) => (
            <Link
              key={card.label}
              to={card.href}
              className="group rounded-2xl border border-white/30 bg-white/65 p-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800/70"
            >
              <div className={`mb-3 h-10 w-10 rounded-xl ${card.accent} shadow-sm`} />
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{card.label}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 dark:text-primary-300">
                Open
                <FiArrowRight className="transition-transform group-hover:translate-x-0.5" size={12} />
              </span>
            </Link>
          ))}
        </div>

        <div className="mb-12 grid gap-4 lg:grid-cols-3">
          {goalCards.map((goal) => (
            <Link key={goal.title} to={goal.href} className="atlas-panel rounded-3xl p-6 transition-transform hover:-translate-y-1">
              <p className="atlas-kicker">{t('home.popularIntent')}</p>
              <h2 className="mt-2 text-2xl text-ink dark:text-white">{goal.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{goal.copy}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-300">
                {t('common.openPath')}
                <FiArrowRight />
              </span>
            </Link>
          ))}
        </div>

        <div className="atlas-panel mb-12 p-6">
          <div className="mb-6">
            <p className="atlas-kicker">{t('common.howItWorks')}</p>
            <h2 className="text-2xl text-ink dark:text-white">{t('home.routeTitle')}</h2>
            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
              {t('home.routeCopy')}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="rounded-3xl bg-[#f6efe7] p-5 dark:bg-white/5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex rounded-2xl bg-white/80 p-3 text-primary-600 dark:bg-white/10 dark:text-primary-300">
                      <Icon />
                    </div>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.copy}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="atlas-panel mb-12 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="atlas-kicker">{t('home.commercialReadiness')}</p>
              <h2 className="text-2xl text-ink dark:text-white">{t('home.commercialTitle')}</h2>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                {t('home.commercialCopy')}
              </p>
            </div>
            <Link to="/pricing" className="btn btn-primary w-full sm:w-auto">{t('home.comparePlans')}</Link>
          </div>
        </div>

        <div className="mb-12">
          <div className="mb-6">
            <p className="atlas-kicker">{t('home.whyTitle')}</p>
            <h2 className="text-3xl font-bold text-ink dark:text-white">{t('home.whyHeading')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {platformSignals.map((signal) => {
              const Icon = signal.icon
              return (
                <div key={signal.title} className="atlas-panel rounded-3xl p-6">
                  <div className="inline-flex rounded-2xl bg-primary-500/10 p-3 text-primary-600 dark:text-primary-300">
                    <Icon />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink dark:text-white">{signal.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{signal.copy}</p>
                </div>
              )
            })}
          </div>
        </div>

        <h2 className="mb-6 text-3xl font-bold text-ink dark:text-white">{t('home.featuredPaths')}</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div role="alert" className="atlas-panel flex flex-col items-start gap-4 p-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">{t('home.coursesLoadError')}</p>
            <button type="button" className="btn btn-primary" onClick={() => fetchCourses({ limit: 6 })}>
              {t('home.retryCourses')}
            </button>
          </div>
        ) : safeCourses.length === 0 ? (
          <p className="text-slate-400">{t('home.noCourses')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {safeCourses.slice(0, 6).map((course) => {
              const courseId = course._id || course.id
              return (
                <div
                  key={courseId}
                  className="atlas-panel flex flex-col justify-between rounded-3xl p-6"
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-[#102a43]/10 px-2.5 py-1 text-xs font-semibold text-ink">
                        {course.level || 'All Levels'}
                      </span>
                      {course.language ? (
                        <span className="inline-flex rounded-full bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                          {course.language}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mb-2 mt-3 text-xl font-bold text-ink dark:text-white">{course.title}</h3>
                    <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{course.description}</p>
                  </div>
                  <Link
                    to={`/courses/${courseId}`}
                    className="btn btn-primary mt-6 block text-center text-sm font-semibold"
                  >
                    {t('home.viewPath')}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
