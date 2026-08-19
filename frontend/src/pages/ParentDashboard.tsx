import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBarChart2, FiBookOpen, FiMessageCircle, FiUsers } from 'react-icons/fi'
import api from '../services/api'

export default function ParentDashboard() {
  const [studentEmail, setStudentEmail] = useState('')
  const [links, setLinks] = useState<Array<{ _id: string; status: string; student?: { firstName: string; lastName: string } }>>([])

  useEffect(() => {
    api.get('/family').then((response) => setLinks(response.data.data || [])).catch(() => undefined)
  }, [])

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
        <div><p className="atlas-kicker">Family learning desk</p><h1>See the whole learning picture.</h1><p>Follow progress, encourage consistency, and stay close to your learner's next step.</p></div>
        <img src={`${import.meta.env.BASE_URL}atlas-study.svg`} alt="Language atlas study illustration" />
      </div>
      <div className="atlas-stat-grid mb-8">
        <div className="atlas-stat"><FiUsers /><strong>0</strong><span>Linked learners</span></div>
        <div className="atlas-stat"><FiBarChart2 /><strong>0%</strong><span>Average progress</span></div>
        <div className="atlas-stat"><FiBookOpen /><strong>0</strong><span>Lessons this week</span></div>
      </div>
      <div className="atlas-panel p-6"><div className="flex items-center gap-3 mb-3"><FiMessageCircle className="text-coral" /><h2>Family support</h2></div><p className="text-muted mb-5">Connect a learner through an approved family request, then message their teacher or support team.</p><form onSubmit={requestLink} className="inline-form mb-5"><input className="input" type="email" required value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} placeholder="Learner email" /><button className="btn btn-primary">Request link</button></form><div className="space-y-2 mb-5">{links.map((link) => <div key={link._id} className="flex justify-between items-center p-3 rounded-lg bg-[#f6efe7]"><span>{link.student ? `${link.student.firstName} ${link.student.lastName}` : 'Learner'}</span><span className="status-pill">{link.status}</span></div>)}</div><Link to="/chat" className="btn btn-primary inline-flex items-center gap-2">Open family chat <FiMessageCircle /></Link></div>
    </div>
  )
}
