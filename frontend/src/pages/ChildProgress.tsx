import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiBarChart2, FiBookOpen } from 'react-icons/fi'
import api from '../services/api'

interface Child { firstName: string; lastName: string; email: string; xp: number; streak: number }
interface Course { courseId: string; title: string; progressPercentage: number; isCompleted: boolean }

export default function ChildProgress() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [child, setChild] = useState<Child | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) return
    api.get(`/family/children/${studentId}`)
      .then((response) => {
        setChild(response.data.data.student)
        setCourses(response.data.data.courses || [])
      })
      .catch((error: any) => toast.error(error.response?.data?.message || 'Progress could not be loaded'))
      .finally(() => setLoading(false))
  }, [studentId])

  if (loading) return <div className="atlas-page p-8 text-center">Loading learner progress...</div>
  if (!child) return <div className="atlas-page p-8 text-center">Learner progress is unavailable.</div>

  return (
    <div className="atlas-page max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="icon-button mb-6" aria-label="Back"><FiArrowLeft /></button>
      <div className="atlas-heading mb-8"><p className="atlas-kicker">Learner view</p><h1>{child.firstName} {child.lastName}</h1><p>{child.email}</p></div>
      <div className="atlas-stat-grid mb-8">
        <div className="atlas-stat"><FiBarChart2 /><strong>{child.xp}</strong><span>XP earned</span></div>
        <div className="atlas-stat"><FiBookOpen /><strong>{child.streak}</strong><span>Day streak</span></div>
        <div className="atlas-stat"><FiBarChart2 /><strong>{courses.length}</strong><span>Active courses</span></div>
      </div>
      <section className="atlas-panel p-6"><h2 className="mb-6">Course progress</h2><div className="space-y-5">{courses.length === 0 ? <p className="text-muted">No course progress yet.</p> : courses.map((course) => <div key={course.courseId}><div className="flex justify-between mb-2"><strong>{course.title}</strong><span>{course.progressPercentage}%</span></div><div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-[#f26b5b] h-2 rounded-full" style={{ width: `${course.progressPercentage}%` }} /></div><p className="text-sm text-muted mt-2">{course.isCompleted ? 'Completed' : 'In progress'}</p></div>)}</div></section>
    </div>
  )
}
