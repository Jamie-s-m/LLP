import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBarChart2, FiBookOpen, FiMessageCircle, FiUsers } from 'react-icons/fi'
import api from '../services/api'
import { useI18n } from '../utils/i18n'

export default function ParentDashboard() {
  const { t } = useI18n()
  const [studentEmail, setStudentEmail] = useState('')
  const [links, setLinks] = useState<Array<{ _id: string; status: string; student?: { _id: string; firstName: string; lastName: string; xp: number; streak: number } }>>([])
  const [averageProgress, setAverageProgress] = useState(0)
  const [activeThisWeek, setActiveThisWeek] = useState(0)

  const loadFamily = () => {
    Promise.all([api.get('/family'), api.get('/family/children-progress')])
      .then(([linksResponse, progressResponse]) => {
        setLinks(linksResponse.data.data || [])
        setAverageProgress(progressResponse.data.data?.averageProgress || 0)
        setActiveThisWeek(progressResponse.data.data?.activeThisWeek || 0)
      })
      .catch(() => undefined)
  }

  useEffect(() => { loadFamily() }, [])

  const requestLink = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const response = await api.post('/family', { studentEmail })
      setLinks((current) => [response.data.data, ...current])
      setStudentEmail('')
      toast.success(t('parentDashboard.familyRequestSent'))
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('parentDashboard.familyRequestError'))
    }
  }

  return (
    <div className="atlas-page max-w-7xl mx-auto px-4 py-8">
      <div className="atlas-hero mb-8">
        <div>
          <p className="atlas-kicker">{t('parentDashboard.heroKicker')}</p>
          <h1>{t('parentDashboard.heroTitle')}</h1>
          <p>{t('parentDashboard.heroCopy')}</p>
        </div>
        <img src={`${import.meta.env.BASE_URL}linguanest-orbit.svg`} alt="LinguaNest family learning illustration" />
      </div>
      <div className="atlas-stat-grid mb-8">
        <div className="atlas-stat"><FiUsers /><strong>{links.filter((link) => link.status === 'approved').length}</strong><span>{t('parentDashboard.linkedLearners')}</span></div>
        <div className="atlas-stat"><FiBarChart2 /><strong>{averageProgress}%</strong><span>{t('parentDashboard.averageProgress')}</span></div>
        <div className="atlas-stat"><FiBookOpen /><strong>{activeThisWeek}</strong><span>{t('parentDashboard.activeCourses')}</span></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="atlas-panel p-6">
          <div className="mb-3 flex items-center gap-3">
            <FiMessageCircle className="text-coral" />
            <h2 className="text-2xl text-ink dark:text-white">{t('parentDashboard.supportTitle')}</h2>
          </div>
          <p className="mb-5 text-muted">{t('parentDashboard.supportCopy')}</p>
          <form onSubmit={requestLink} className="mb-5 flex flex-col gap-3 sm:flex-row">
            <input className="input" type="email" required value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder={t('parentDashboard.learnerEmail')} />
            <button className="btn btn-primary sm:min-w-40">{t('parentDashboard.requestLink')}</button>
          </form>
          <div className="rounded-2xl bg-[var(--surface-strong)] p-4 dark:bg-white/5">
            <p className="text-sm font-semibold text-ink dark:text-white">{t('common.howItWorks')}</p>
            <p className="mt-2 text-sm text-muted">{t('parentDashboard.howItWorksCopy')}</p>
          </div>
          <Link to="/chat" className="btn btn-primary mt-5 inline-flex items-center gap-2">{t('parentDashboard.openFamilyChat')} <FiMessageCircle /></Link>
        </section>
        <section className="atlas-panel p-6">
          <p className="atlas-kicker">{t('parentDashboard.linksKicker')}</p>
          <h2 className="text-2xl text-ink dark:text-white">{t('parentDashboard.linkedLearners')}</h2>
          <div className="mt-5 space-y-3">
            {links.length === 0 ? (
              <div className="empty-state">
                <FiUsers />
                <p>{t('parentDashboard.noLinks')}</p>
              </div>
            ) : links.map((link) => (
              <div key={link._id} className="flex items-center justify-between rounded-2xl bg-[var(--surface-strong)] p-4 dark:bg-white/5">
                <div>
                  {link.student && link.status === 'approved' ? <Link className="font-semibold text-ink dark:text-white" to={`/parent/children/${link.student._id}`}>{link.student.firstName} {link.student.lastName}</Link> : link.student ? <span className="font-semibold text-ink dark:text-white">{link.student.firstName} {link.student.lastName}</span> : <span className="font-semibold text-ink dark:text-white">{t('parentDashboard.learnerFallback')}</span>}
                  {link.student ? <p className="mt-1 text-sm text-muted">{t('parentDashboard.streakDays', { xp: link.student.xp, streak: link.student.streak })}</p> : null}
                  {link.status === 'pending' ? <p className="mt-1 text-sm text-muted">{t('parentDashboard.waitingApproval')}</p> : null}
                </div>
                <span className={`status-pill ${link.status === 'approved' ? '' : 'muted'}`}>{link.status === 'approved' ? t('parentDashboard.statusApproved') : link.status === 'rejected' ? t('parentDashboard.statusRejected') : t('parentDashboard.statusPending')}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
