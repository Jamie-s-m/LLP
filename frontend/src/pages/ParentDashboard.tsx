import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBarChart2, FiBookOpen, FiMessageCircle, FiUsers } from 'react-icons/fi'
import api from '../services/api'

export default function ParentDashboard() {
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
      toast.success('Family request sent')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Request could not be sent')
    }
  }

  return (
    <div className="atlas-page max-w-7xl mx-auto px-4 py-8">
      <div className="atlas-hero mb-8">
        <div>
          <p className="atlas-kicker">Family learning desk</p>
          <h1>See every signal behind progress.</h1>
          <p>Follow progress, encourage consistency, and stay close to your learner&apos;s next milestone.</p>
        </div>
        <img src={`${import.meta.env.BASE_URL}auralex-orbit.svg`} alt="Auralex family learning illustration" />
      </div>
      <div className="atlas-stat-grid mb-8">
        <div className="atlas-stat"><FiUsers /><strong>{links.filter((link) => link.status === 'approved').length}</strong><span>Linked learners</span></div>
        <div className="atlas-stat"><FiBarChart2 /><strong>{averageProgress}%</strong><span>Average progress</span></div>
        <div className="atlas-stat"><FiBookOpen /><strong>{activeThisWeek}</strong><span>Active courses this week</span></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="atlas-panel p-6">
          <div className="mb-3 flex items-center gap-3">
            <FiMessageCircle className="text-coral" />
            <h2 className="text-2xl text-ink dark:text-white">Family support</h2>
          </div>
          <p className="mb-5 text-muted">Connect a learner through an approved family request, then message their teacher or support team.</p>
          <form onSubmit={requestLink} className="mb-5 flex flex-col gap-3 sm:flex-row">
            <input className="input" type="email" required value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="Learner email" />
            <button className="btn btn-primary sm:min-w-40">Request link</button>
          </form>
          <div className="rounded-2xl bg-[#f6efe7] p-4 dark:bg-white/5">
            <p className="text-sm font-semibold text-ink dark:text-white">How it works</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Send a request using your learner&apos;s email. The learner can approve it from their dashboard, and admins or moderators can also review it from the control center.</p>
          </div>
          <Link to="/chat" className="btn btn-primary mt-5 inline-flex items-center gap-2">Open family chat <FiMessageCircle /></Link>
        </section>
        <section className="atlas-panel p-6">
          <p className="atlas-kicker">Family links</p>
          <h2 className="text-2xl text-ink dark:text-white">Linked learners</h2>
          <div className="mt-5 space-y-3">
            {links.length === 0 ? (
              <div className="empty-state">
                <FiUsers />
                <p>No learner links yet.</p>
              </div>
            ) : links.map((link) => (
              <div key={link._id} className="flex items-center justify-between rounded-2xl bg-[#f6efe7] p-4 dark:bg-white/5">
                <div>
                  {link.student ? <Link className="font-semibold text-ink dark:text-white" to={`/parent/children/${link.student._id}`}>{link.student.firstName} {link.student.lastName}</Link> : <span className="font-semibold text-slate-700 dark:text-slate-100">Learner</span>}
                  {link.student ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{link.student.xp} XP · {link.student.streak} day streak</p> : null}
                  {link.status === 'pending' ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Waiting for learner or admin approval.</p> : null}
                </div>
                <span className={`status-pill ${link.status === 'approved' ? '' : 'muted'}`}>{link.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
