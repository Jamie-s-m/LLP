import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { FiCheck, FiClock, FiTarget, FiUsers, FiX, FiZap } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import { useI18n } from '../../utils/i18n'
import DailyReward from '../../components/DailyReward'
import InstallPrompt from '../../components/InstallPrompt'
import NotificationOptIn from '../../components/NotificationOptIn'
import CoinStore from '../../components/CoinStore'
import Illustration from '../../components/illustrations/Illustration'
import Orbit, { type CefrLevel } from '../../components/orbit/Orbit'

interface Summary {
  totalCourses: number
  completedCourses: number
  totalXp: number
  streak: number
}

interface SkillProfile {
  overallCefr: string | null
  overallLevel: string | null
  skills: Array<{
    skill: string
    placement: { accuracyPercent: number | null }
    practice: { accuracyPercent: number | null }
  }>
}

interface ActivityDay {
  date: string
  count: number
}

const ORBIT_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1']
const LOCALE_BY_LANGUAGE: Record<string, string> = { en: 'en-US', ru: 'ru-RU', uz: 'uz-UZ' }

function toOrbitLevel(cefr: string | null): CefrLevel {
  const normalized = (cefr || '').toUpperCase()
  return (ORBIT_LEVELS as string[]).includes(normalized) ? (normalized as CefrLevel) : 'A1'
}

interface TodayRecommendation {
  continueLesson: { lessonId: string; courseId: string; courseTitle: string; lessonTitle: string; cefr: string | null } | null
  weakestSkill: { skill: string; state: string; courseId: string } | null
  overdueFlashcardCount: number
}

interface FamilyLinkRequest {
  _id: string
  status: 'pending' | 'approved' | 'rejected'
  parent?: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
}
export default function Dashboard() {
  const { user } = useAuthStore()
  const { t } = useI18n()
  const language = useLanguageStore((state) => state.language)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [familyLinks, setFamilyLinks] = useState<FamilyLinkRequest[]>([])
  const [today, setToday] = useState<TodayRecommendation | null>(null)
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null)
  const [activity, setActivity] = useState<ActivityDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users/dashboard-summary'),
      api.get('/family'),
      // Caught separately: none of these are a reason to fail the whole page if they error -
      // each is a supplementary panel on top of the dashboard's core stats.
      api.get('/progress/today').catch(() => null),
      api.get('/progress/skill-profile').catch(() => null),
      api.get('/progress/weekly-activity').catch(() => null),
    ])
      .then(([summaryResponse, familyResponse, todayResponse, skillProfileResponse, activityResponse]) => {
        setSummary(summaryResponse.data.data)
        setFamilyLinks(familyResponse.data.data || [])
        setToday(todayResponse?.data?.data ?? null)
        setSkillProfile(skillProfileResponse?.data?.data ?? null)
        setActivity(Array.isArray(activityResponse?.data?.data) ? activityResponse.data.data : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const orbitLevel = toOrbitLevel(skillProfile?.overallCefr ?? null)
  const orbitSkills = (skillProfile?.skills ?? []).map((row) => ({
    key: row.skill,
    label: row.skill,
    mastery: row.practice.accuracyPercent ?? row.placement.accuracyPercent ?? 0,
  }))
  // A rough, honestly-labeled proxy for "progress within the current level" - the average of
  // whatever real per-skill accuracy exists, not a fabricated metric. Matches this codebase's
  // established practice (see progressController.js#getSkillProfile) of reporting an honest
  // approximation rather than implying precision the underlying data doesn't support.
  const measuredSkills = orbitSkills.filter((s) => s.mastery > 0)
  const orbitLevelProgress = measuredSkills.length
    ? Math.round(measuredSkills.reduce((sum, s) => sum + s.mastery, 0) / measuredSkills.length)
    : 0
  const activityChartData = activity.map((day) => ({
    label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString(LOCALE_BY_LANGUAGE[language] || 'en-US', { weekday: 'short', timeZone: 'UTC' }),
    count: day.count,
  }))

  const progressPercent = summary && summary.totalCourses > 0
    ? Math.round((summary.completedCourses / summary.totalCourses) * 100)
    : 0
  const pendingFamilyRequests = familyLinks.filter((link) => link.status === 'pending')

  const reviewFamilyRequest = async (id: string, status: 'approved' | 'rejected') => {
    await api.patch(`/family/${id}/review`, { status })
    setFamilyLinks((current) => current.map((link) => link._id === id ? { ...link, status } : link))
  }

  return (
    <div className="atlas-page px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="atlas-hero mb-8">
          <div>
            <p className="atlas-kicker">{t('studentDashboard.heroKicker')}</p>
            <h1>{t('studentDashboard.heroTitle')}</h1>
            <p>{t('studentDashboard.heroCopy')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/courses" className="btn btn-primary">{t('studentDashboard.exploreCourses')}</Link>
              <Link to="/my-learning" className="btn btn-outline">{t('studentDashboard.openLearning')}</Link>
            </div>
            {/* md, not sm - a live user report showed this still rendering on a real phone at
                what should have been a sub-640px viewport (likely a WebView that reports a
                wider effective width than a typical mobile browser) - md (768px) is a safer
                margin for "definitely not a phone" given decorative content shouldn't cost
                scroll depth on a device we can't fully verify the effective width of. */}
            <div className="hero-orbit-wrap mt-6 hidden md:flex" aria-hidden="true">
              <Illustration name="online-learning" className="hero-orbit-image" />
            </div>
          </div>
          <div className="atlas-hero-card">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{t('studentDashboard.todaysFocus')}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <Link to="/progress" className="mx-auto block h-28 w-28 shrink-0" aria-label={`Your CEFR progress: ${orbitLevel}`}>
                <Orbit currentLevel={orbitLevel} levelProgress={orbitLevelProgress} variant="compact" />
              </Link>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <FiZap className="mb-3 text-xl text-secondary-200" />
                  <strong className="block text-3xl text-white">{summary?.streak ?? 0}</strong>
                  <span className="text-sm text-white/80">{t('studentDashboard.dayStreak')}</span>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <FiTarget className="mb-3 text-xl text-primary-200" />
                  <strong className="block text-3xl text-white">{progressPercent}%</strong>
                  <span className="text-sm text-white/80">{t('studentDashboard.courseCompletion')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {user?.teacherApplicationStatus === 'pending' && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <FiClock size={20} />
            <p>{t('studentDashboard.teacherPending')}</p>
          </div>
        )}
        {!user?.placementLevel && (
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--accent-light)] p-4 text-[var(--text-primary)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <FiTarget size={20} className="text-[var(--accent)]" />
              <div>
                <p className="font-semibold">{t('studentDashboard.placementNudgeTitle')}</p>
                <p className="text-sm text-muted">{t('studentDashboard.placementNudgeCopy')}</p>
              </div>
            </div>
            <Link to="/placement-test" className="btn btn-primary whitespace-nowrap">{t('studentDashboard.placementNudgeCta')}</Link>
          </div>
        )}
        {pendingFamilyRequests.length > 0 ? (
          <div className="atlas-panel mb-8 p-6">
            <div className="mb-5 flex items-center gap-3">
              <FiUsers className="text-coral" />
              <div>
                <h2 className="text-2xl text-ink dark:text-white">{t('studentDashboard.familyRequestsTitle')}</h2>
                <p className="text-muted">{t('studentDashboard.familyRequestsCopy')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingFamilyRequests.map((link) => (
                <div key={link._id} className="flex flex-col gap-4 rounded-2xl bg-[var(--surface-strong)] p-4 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <strong className="text-ink dark:text-white">{link.parent?.firstName} {link.parent?.lastName}</strong>
                    <p className="mt-1 text-sm text-muted">{link.parent?.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary inline-flex items-center gap-2"
                      onClick={() => reviewFamilyRequest(link._id, 'approved')}
                    >
                      <FiCheck />
                      {t('studentDashboard.approve')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline inline-flex items-center gap-2"
                      onClick={() => reviewFamilyRequest(link._id, 'rejected')}
                    >
                      <FiX />
                      {t('studentDashboard.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {loading ? (
          <div className="atlas-panel p-6 text-muted">{t('common.loadingProgress')}</div>
        ) : (
          <>
            {/* Next step comes first, above the fold on mobile - it's the one action this
                page exists to surface. The old layout buried it below a fully redundant
                stat grid (streak/completion already shown in the hero above) and a second
                progress bar repeating the same completion% again. */}
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="atlas-panel p-6">
                <p className="atlas-kicker">{t('studentDashboard.nextStepKicker')}</p>
                <h2 className="text-2xl text-ink dark:text-white">{t('studentDashboard.nextStepHeading')}</h2>
                <p className="mt-2 text-muted">
                  {today?.continueLesson
                    ? t('studentDashboard.nextStepContinueLesson', { title: today.continueLesson.lessonTitle })
                    : summary?.totalCourses ? t('studentDashboard.nextStepContinue') : t('studentDashboard.nextStepStart')}
                </p>
                <div className="mt-5">
                  {today?.continueLesson ? (
                    <Link to={`/lesson/${today.continueLesson.lessonId}`} className="btn btn-primary">
                      {t('studentDashboard.resumeLearning')}
                    </Link>
                  ) : (
                    <Link to={summary?.totalCourses ? '/my-learning' : '/courses'} className="btn btn-primary">
                      {summary?.totalCourses ? t('studentDashboard.resumeLearning') : t('studentDashboard.browseCourses')}
                    </Link>
                  )}
                </div>
                {today?.weakestSkill ? (
                  <p className="mt-4 text-sm text-muted">
                    {t('studentDashboard.nextStepWeakSkill', { skill: t(`skills.${today.weakestSkill.skill}`) })}
                  </p>
                ) : null}
                {today && today.overdueFlashcardCount > 0 ? (
                  <Link to="/flashcards" className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
                    {t(
                      today.overdueFlashcardCount === 1 ? 'studentDashboard.nextStepFlashcardsDue' : 'studentDashboard.nextStepFlashcardsDuePlural',
                      { count: today.overdueFlashcardCount }
                    )}
                  </Link>
                ) : null}
              </div>

              <div className="atlas-panel p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="atlas-kicker">{t('studentDashboard.progressKicker')}</p>
                    <h2 className="text-2xl text-ink dark:text-white">{t('studentDashboard.progressHeading')}</h2>
                  </div>
                  <div className="flex shrink-0 gap-4 text-right text-sm text-muted">
                    <span><strong className="block text-lg text-ink dark:text-white">{summary?.totalXp ?? 0}</strong>{t('studentDashboard.totalPoints')}</span>
                    <span><strong className="block text-lg text-ink dark:text-white">{progressPercent}%</strong>{t('studentDashboard.overallCompletion')}</span>
                  </div>
                </div>
                <div
                  role="progressbar"
                  aria-label={t('studentDashboard.overallCompletion')}
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border-light)]"
                >
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${progressPercent}%` }} />
                </div>
                {activityChartData.length > 0 ? (
                  <div className="mt-6">
                    <p className="mb-2 text-sm text-muted">{t('studentDashboard.weeklyActivity')}</p>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityChartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="dashboardActivityFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="label" interval={0} padding={{ left: 12, right: 12 }} tick={{ fontSize: 11, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(value) => [String(value ?? 0), t('studentDashboard.exercisesCompleted')]}
                            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                          />
                          <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="url(#dashboardActivityFill)" isAnimationActive />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted">{t('studentDashboard.progressCopy', { completed: summary?.completedCourses ?? 0, total: summary?.totalCourses ?? 0 })}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mt-6">
              <DailyReward />
              <CoinStore />
            </div>

            {/* A compact opt-in nudge, not daily content - NotificationOptIn already hides
                its own "enable" affordance once already subscribed (see the component).
                InstallPrompt is a fixed-position overlay (renders null unless the browser
                actually fires a real install prompt) - it doesn't take up scroll space
                regardless of where it's mounted, kept here only because it needs to be
                mounted somewhere on an authenticated page. */}
            <div className="atlas-panel mt-6 p-4"><NotificationOptIn /></div>
            <InstallPrompt />
          </>
        )}
      </div>
    </div>
  )
}
