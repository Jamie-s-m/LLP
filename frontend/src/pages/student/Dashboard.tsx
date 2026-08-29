import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBookOpen, FiCheck, FiClock, FiTarget, FiUsers, FiX, FiZap } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useI18n } from '../../utils/i18n'
import DailyReward from '../../components/DailyReward'
import InstallPrompt from '../../components/InstallPrompt'
import NotificationOptIn from '../../components/NotificationOptIn'
import CoinStore from '../../components/CoinStore'

interface Summary {
  totalCourses: number
  completedCourses: number
  totalXp: number
  streak: number
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
  const [summary, setSummary] = useState<Summary | null>(null)
  const [familyLinks, setFamilyLinks] = useState<FamilyLinkRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/users/dashboard-summary'), api.get('/family')])
      .then(([summaryResponse, familyResponse]) => {
        setSummary(summaryResponse.data.data)
        setFamilyLinks(familyResponse.data.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

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
              <Link to="/my-learning" className="btn btn-outline border-white/70 text-white hover:bg-white/10 dark:border-white/30 dark:text-white dark:hover:bg-white/10">{t('studentDashboard.openLearning')}</Link>
            </div>
          </div>
          <div className="atlas-hero-card">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{t('studentDashboard.todaysFocus')}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <FiZap className="mb-3 text-xl text-[#a7e8d5]" />
                <strong className="block text-3xl text-white">{summary?.streak ?? 0}</strong>
                <span className="text-sm text-white/80">{t('studentDashboard.dayStreak')}</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <FiTarget className="mb-3 text-xl text-[#f8c16c]" />
                <strong className="block text-3xl text-white">{progressPercent}%</strong>
                <span className="text-sm text-white/80">{t('studentDashboard.courseCompletion')}</span>
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
                <div key={link._id} className="flex flex-col gap-4 rounded-2xl bg-[#f6efe7] p-4 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
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
          <div className="atlas-panel p-6 text-slate-600 dark:text-slate-300">{t('common.loadingProgress')}</div>
        ) : (
          <>
            <div className="atlas-stat-grid mb-8">
              <div className="atlas-stat"><FiZap /><strong>{summary?.totalXp ?? 0}</strong><span>{t('studentDashboard.totalPoints')}</span></div>
              <div className="atlas-stat"><FiClock /><strong>{summary?.streak ?? 0}</strong><span>{t('studentDashboard.currentStreak')}</span></div>
              <div className="atlas-stat"><FiBookOpen /><strong>{summary?.totalCourses ?? 0}</strong><span>{t('studentDashboard.enrolledCourses')}</span></div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="atlas-panel p-6">
                <p className="atlas-kicker">{t('studentDashboard.progressKicker')}</p>
                <h2 className="text-2xl text-ink dark:text-white">{t('studentDashboard.progressHeading')}</h2>
                <p className="mt-2 text-muted">{t('studentDashboard.progressCopy', { completed: summary?.completedCourses ?? 0, total: summary?.totalCourses ?? 0 })}</p>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>{t('studentDashboard.overallCompletion')}</span>
                  <strong className="text-ink dark:text-white">{progressPercent}%</strong>
                </div>
              </div>

              {/* Right column: next step + daily reward */}
              <div className="space-y-4">
                <div className="atlas-panel p-6">
                  <p className="atlas-kicker">{t('studentDashboard.nextStepKicker')}</p>
                  <h2 className="text-2xl text-ink dark:text-white">{t('studentDashboard.nextStepHeading')}</h2>
                  <p className="mt-2 text-muted">{summary?.totalCourses ? t('studentDashboard.nextStepContinue') : t('studentDashboard.nextStepStart')}</p>
                  <div className="mt-5">
                    <Link to={summary?.totalCourses ? '/my-learning' : '/courses'} className="btn btn-primary">
                      {summary?.totalCourses ? t('studentDashboard.resumeLearning') : t('studentDashboard.browseCourses')}
                    </Link>
                  </div>
                </div>

                <DailyReward />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mt-6">
              <NotificationOptIn />
              <CoinStore />
            </div>

            <InstallPrompt />

            <div className="atlas-panel mt-6 p-6">
              <p className="atlas-kicker">{t('studentDashboard.structuredKicker')}</p>
              <h2 className="text-2xl text-ink dark:text-white">{t('studentDashboard.structuredHeading')}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {[t('studentDashboard.structured1'), t('studentDashboard.structured2'), t('studentDashboard.structured3')].map((item) => (
                  <div key={item} className="rounded-2xl bg-[#f6efe7] p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">{item}</div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
