import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiBookOpen, FiCheck, FiEdit3, FiMessageSquare, FiPlus, FiTrash2, FiUserCheck, FiUsers, FiX } from 'react-icons/fi'
import api from '../../services/api'

interface Course { _id: string; title: string; language: string; level: string; isPublished: boolean; totalLessons: number }
interface User { _id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean }
interface Application { _id: string; firstName: string; lastName: string; email: string }

type Tab = 'courses' | 'users' | 'content' | 'applications' | 'moderation'

export default function ControlCenter() {
  const [tab, setTab] = useState<Tab>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [resource, setResource] = useState('lessons')
  const [content, setContent] = useState<Array<{ _id: string; title?: string; name?: string; content?: string }>>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [courseResponse, userResponse] = await Promise.all([api.get('/courses'), api.get('/admin/users')])
      setCourses(courseResponse.data.data || courseResponse.data || [])
      setUsers(userResponse.data.data || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Admin data could not be loaded')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const createCourse = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    try {
      await api.post('/courses', { title, description: 'New learning track', language: 'English', level: 'Beginner', category: 'Conversation' })
      setTitle(''); await load(); toast.success('Course created')
    } catch (error: any) { toast.error(error.response?.data?.message || 'Course could not be created') }
  }

  const removeCourse = async (id: string) => {
    if (!window.confirm('Delete this course and its public listing?')) return
    try { await api.delete(`/courses/${id}`); setCourses((current) => current.filter((course) => course._id !== id)); toast.success('Course deleted') }
    catch (error: any) { toast.error(error.response?.data?.message || 'Course could not be deleted') }
  }

  const renameCourse = async (course: Course) => {
    const nextTitle = window.prompt('Course title', course.title)?.trim()
    if (!nextTitle || nextTitle === course.title) return
    try {
      await api.put(`/courses/${course._id}`, { title: nextTitle })
      setCourses((current) => current.map((item) => item._id === course._id ? { ...item, title: nextTitle } : item))
      toast.success('Course updated')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Course could not be updated')
    }
  }

  const toggleUser = async (user: User) => {
    try { await api.patch(`/admin/users/${user._id}`, { isActive: !user.isActive }); setUsers((current) => current.map((item) => item._id === user._id ? { ...item, isActive: !item.isActive } : item)); toast.success('User status updated') }
    catch (error: any) { toast.error(error.response?.data?.message || 'User could not be updated') }
  }

  const loadContent = async (nextResource = resource) => {
    try { const response = await api.get(`/admin/content/${nextResource}`); setContent(response.data.data || []) }
    catch (error: any) { toast.error(error.response?.data?.message || 'Content could not be loaded') }
  }

  const removeContent = async (id: string) => {
    if (!window.confirm('Delete this content item?')) return
    try { await api.delete(`/admin/content/${resource}/${id}`); setContent((current) => current.filter((item) => item._id !== id)); toast.success('Content deleted') }
    catch (error: any) { toast.error(error.response?.data?.message || 'Content could not be deleted') }
  }

  const loadApplications = async () => {
    try { const response = await api.get('/admin/teacher-applications'); setApplications(response.data.data || []) }
    catch (error: any) { toast.error(error.response?.data?.message || 'Applications could not be loaded') }
  }

  const reviewApplication = async (id: string, approve: boolean) => {
    try {
      await api.patch(`/admin/teacher-applications/${id}`, { approve })
      setApplications((current) => current.filter((item) => item._id !== id))
      toast.success(approve ? 'Applicant promoted to teacher' : 'Application rejected')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Application could not be reviewed')
    }
  }

  return (
    <div className="atlas-page max-w-7xl mx-auto px-4 py-8">
      <div className="atlas-heading mb-8"><p className="atlas-kicker">Operations desk</p><h1>Run the learning atlas.</h1><p>Manage people, curriculum, and community from one focused control center.</p></div>
      <div className="admin-tabs mb-6">{([['courses', FiBookOpen, 'Courses'], ['users', FiUsers, 'People'], ['content', FiEdit3, 'Content'], ['applications', FiUserCheck, 'Applications'], ['moderation', FiMessageSquare, 'Moderation']] as const).map(([value, Icon, label]) => <button key={value} onClick={() => { setTab(value); if (value === 'content') loadContent(); if (value === 'applications') loadApplications() }} className={tab === value ? 'active' : ''}><Icon />{label}</button>)}</div>
      {tab === 'courses' && <section className="atlas-panel p-6"><div className="flex flex-wrap justify-between gap-4 mb-6"><div><p className="atlas-kicker">Content inventory</p><h2>Courses</h2></div><form onSubmit={createCourse} className="inline-form"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Course title" /><button className="btn btn-primary" aria-label="Add course"><FiPlus /></button></form></div>{loading ? <p>Loading curriculum...</p> : <div className="admin-table">{courses.map((course) => <div className="admin-row" key={course._id}><div><strong>{course.title}</strong><small>{course.language} · {course.level} · {course.totalLessons || 0} lessons</small></div><span className="status-pill">{course.isPublished ? 'Published' : 'Draft'}</span><button onClick={() => renameCourse(course)} className="icon-button" aria-label={`Edit ${course.title}`}><FiEdit3 /></button><button onClick={() => removeCourse(course._id)} className="icon-button danger" aria-label={`Delete ${course.title}`}><FiTrash2 /></button></div>)}{courses.length === 0 && <div className="empty-state"><FiBookOpen /><p>No courses yet.</p></div>}</div>}</section>}
      {tab === 'users' && <section className="atlas-panel p-6"><h2 className="mb-6">People & roles</h2><div className="admin-table">{users.map((user) => <div className="admin-row" key={user._id}><div><strong>{user.firstName} {user.lastName}</strong><small>{user.email} · {user.role}</small></div><span className={`status-pill ${user.isActive ? '' : 'muted'}`}>{user.isActive ? 'Active' : 'Suspended'}</span><button onClick={() => toggleUser(user)} className="icon-button" aria-label={`Toggle ${user.email}`}><FiEdit3 /></button></div>)}</div></section>}
      {tab === 'content' && <section className="atlas-panel p-6"><div className="flex flex-wrap items-center justify-between gap-4 mb-6"><h2>Content library</h2><select className="input max-w-xs" value={resource} onChange={(event) => { setResource(event.target.value); loadContent(event.target.value) }}><option value="lessons">Lessons</option><option value="flashcards">Flashcards</option><option value="posts">Forum posts</option><option value="groups">Groups</option></select></div><div className="admin-table">{content.map((item) => <div className="admin-row" key={item._id}><div><strong>{item.title || item.name || item.content?.slice(0, 70) || 'Untitled item'}</strong><small>{resource} · {item._id}</small></div><button onClick={() => removeContent(item._id)} className="icon-button danger" aria-label="Delete content"><FiTrash2 /></button></div>)}{content.length === 0 && <div className="empty-state"><FiEdit3 /><p>No items in this collection.</p></div>}</div></section>}
      {tab === 'applications' && <section className="atlas-panel p-6"><h2 className="mb-6">Teacher applications</h2><div className="admin-table">{applications.map((applicant) => <div className="admin-row" key={applicant._id}><div><strong>{applicant.firstName} {applicant.lastName}</strong><small>{applicant.email}</small></div><button onClick={() => reviewApplication(applicant._id, true)} className="icon-button" aria-label={`Approve ${applicant.email}`}><FiCheck /></button><button onClick={() => reviewApplication(applicant._id, false)} className="icon-button danger" aria-label={`Reject ${applicant.email}`}><FiX /></button></div>)}{applications.length === 0 && <div className="empty-state"><FiUserCheck /><p>No pending teacher applications.</p></div>}</div></section>}
      {tab === 'moderation' && <section className="atlas-panel p-6"><div className="empty-state full"><FiMessageSquare /><h2>Community moderation</h2><p>Posts, groups, and reports will appear here with moderation actions.</p></div></section>}
    </div>
  )
}
