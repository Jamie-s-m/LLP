import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiBookOpen, FiCheck, FiEdit3, FiMessageSquare, FiPlus, FiTrash2, FiUserCheck, FiUsers, FiX } from 'react-icons/fi'
import api from '../../services/api'

interface Course { _id: string; title: string; description?: string; language: string; level: string; category?: string; isPublished: boolean; totalLessons: number }
interface User { _id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean }
interface Application { _id: string; firstName: string; lastName: string; email: string }
interface CourseForm { title: string; description: string; language: string; level: string; category: string }
interface Overview { totals: { users: number; students: number; teachers: number; parents: number; admins: number; courses: number; publishedCourses: number; lessons: number; flashcards: number; posts: number; pinnedPosts: number; groups: number; pendingTeacherApplications: number; approvedFamilyLinks: number; chatConversations: number; chatMessages: number; enrollments: number; completedEnrollments: number } }

type Tab = 'courses' | 'users' | 'content' | 'applications' | 'moderation'

export default function ControlCenter() {
  const [tab, setTab] = useState<Tab>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [resource, setResource] = useState('lessons')
  const [content, setContent] = useState<Array<{ _id: string; title?: string; name?: string; content?: string }>>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [courseModal, setCourseModal] = useState<Course | null | false>(false)
  const [courseForm, setCourseForm] = useState<CourseForm>({ title: '', description: '', language: 'English', level: 'Beginner', category: 'Conversation' })
  const [moderationResource, setModerationResource] = useState<'posts' | 'groups'>('posts')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const pageSize = 8

  const load = async () => {
    setLoading(true)
    try {
      const [courseResponse, userResponse, overviewResponse] = await Promise.all([api.get('/courses'), api.get('/admin/users'), api.get('/admin/overview')])
      setCourses(courseResponse.data.data || courseResponse.data || [])
      setUsers(userResponse.data.data || [])
      setOverview(overviewResponse.data.data || null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Admin data could not be loaded')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCourseModal = (course?: Course) => {
    setCourseModal(course || null)
    setCourseForm({
      title: course?.title || '',
      description: course?.description || '',
      language: course?.language || 'English',
      level: course?.level || 'Beginner',
      category: course?.category || 'Conversation',
    })
  }

  const saveCourseModal = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (courseModal && typeof courseModal !== 'boolean') {
        await api.put(`/courses/${courseModal._id}`, courseForm)
      } else {
        await api.post('/courses', courseForm)
      }
      setCourseModal(false)
      await load()
      toast.success('Course saved')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Course could not be saved')
    }
  }

  const removeCourse = async (id: string) => {
    if (!window.confirm('Delete this course and its public listing?')) return
    try { await api.delete(`/courses/${id}`); setCourses((current) => current.filter((course) => course._id !== id)); toast.success('Course deleted') }
    catch (error: any) { toast.error(error.response?.data?.message || 'Course could not be deleted') }
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

  const togglePinnedPost = async (item: { _id: string; isPinned?: boolean }) => {
    try {
      await api.patch(`/admin/content/posts/${item._id}`, { isPinned: !item.isPinned })
      setContent((current) => current.map((entry) => entry._id === item._id ? { ...entry, isPinned: !item.isPinned } : entry))
    } catch (error: any) { toast.error(error.response?.data?.message || 'Post could not be updated') }
  }

  const filteredUsers = users.filter((user) => `${user.firstName} ${user.lastName} ${user.email} ${user.role}`.toLowerCase().includes(userSearch.toLowerCase()))
  const visibleUsers = filteredUsers.slice((userPage - 1) * pageSize, userPage * pageSize)
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))

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
      {overview ? <div className="atlas-stat-grid mb-8">{[
        ['Users', overview.totals.users],
        ['Courses', overview.totals.courses],
        ['Published', overview.totals.publishedCourses],
        ['Messages', overview.totals.chatMessages],
        ['Posts', overview.totals.posts],
        ['Pending teachers', overview.totals.pendingTeacherApplications],
      ].map(([label, value]) => <div key={String(label)} className="atlas-stat"><strong>{value}</strong><span>{label}</span></div>)}</div> : null}
      <div className="admin-tabs mb-6">{([['courses', FiBookOpen, 'Courses'], ['users', FiUsers, 'People'], ['content', FiEdit3, 'Content'], ['applications', FiUserCheck, 'Applications'], ['moderation', FiMessageSquare, 'Moderation']] as const).map(([value, Icon, label]) => <button key={value} onClick={() => { setTab(value); if (value === 'content') loadContent(); if (value === 'applications') loadApplications(); if (value === 'moderation') loadContent(moderationResource) }} className={tab === value ? 'active' : ''}><Icon />{label}</button>)}</div>
      {tab === 'courses' && <section className="atlas-panel p-6"><div className="flex flex-wrap justify-between gap-4 mb-6"><div><p className="atlas-kicker">Content inventory</p><h2>Courses</h2></div><button onClick={() => openCourseModal()} className="btn btn-primary inline-flex items-center gap-2"><FiPlus /> New Course</button></div>{loading ? <p>Loading curriculum...</p> : <div className="admin-table">{courses.map((course) => <div className="admin-row" key={course._id}><div><strong>{course.title}</strong><small>{course.language} · {course.level} · {course.totalLessons || 0} lessons</small></div><span className="status-pill">{course.isPublished ? 'Published' : 'Draft'}</span><button onClick={() => openCourseModal(course)} className="icon-button" aria-label={`Edit ${course.title}`}><FiEdit3 /></button><button onClick={() => removeCourse(course._id)} className="icon-button danger" aria-label={`Delete ${course.title}`}><FiTrash2 /></button></div>)}{courses.length === 0 && <div className="empty-state"><FiBookOpen /><p>No courses yet.</p></div>}</div>}</section>}
      {tab === 'users' && <section className="atlas-panel p-6"><div className="flex flex-wrap justify-between gap-4 mb-6"><h2>People & roles</h2><input className="input max-w-sm" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1) }} placeholder="Search name, email, or role" /></div><div className="admin-table">{visibleUsers.map((user) => <div className="admin-row" key={user._id}><div><strong>{user.firstName} {user.lastName}</strong><small>{user.email} · {user.role}</small></div><span className={`status-pill ${user.isActive ? '' : 'muted'}`}>{user.isActive ? 'Active' : 'Suspended'}</span><button onClick={() => toggleUser(user)} className="icon-button" aria-label={`Toggle ${user.email}`}><FiEdit3 /></button></div>)}</div><div className="flex items-center justify-between mt-5 text-sm"><span>{filteredUsers.length} users</span><div className="flex gap-2"><button className="btn btn-outline" disabled={userPage === 1} onClick={() => setUserPage((page) => page - 1)}>Previous</button><span className="px-3 py-2">{userPage} / {totalUserPages}</span><button className="btn btn-outline" disabled={userPage === totalUserPages} onClick={() => setUserPage((page) => page + 1)}>Next</button></div></div></section>}
      {tab === 'content' && <section className="atlas-panel p-6"><div className="flex flex-wrap items-center justify-between gap-4 mb-6"><h2>Content library</h2><select className="input max-w-xs" value={resource} onChange={(event) => { setResource(event.target.value); loadContent(event.target.value) }}><option value="lessons">Lessons</option><option value="flashcards">Flashcards</option><option value="posts">Forum posts</option><option value="groups">Groups</option></select></div><div className="admin-table">{content.map((item) => <div className="admin-row" key={item._id}><div><strong>{item.title || item.name || item.content?.slice(0, 70) || 'Untitled item'}</strong><small>{resource} · {item._id}</small></div><button onClick={() => removeContent(item._id)} className="icon-button danger" aria-label="Delete content"><FiTrash2 /></button></div>)}{content.length === 0 && <div className="empty-state"><FiEdit3 /><p>No items in this collection.</p></div>}</div></section>}
      {tab === 'applications' && <section className="atlas-panel p-6"><h2 className="mb-6">Teacher applications</h2><div className="admin-table">{applications.map((applicant) => <div className="admin-row" key={applicant._id}><div><strong>{applicant.firstName} {applicant.lastName}</strong><small>{applicant.email}</small></div><button onClick={() => reviewApplication(applicant._id, true)} className="icon-button" aria-label={`Approve ${applicant.email}`}><FiCheck /></button><button onClick={() => reviewApplication(applicant._id, false)} className="icon-button danger" aria-label={`Reject ${applicant.email}`}><FiX /></button></div>)}{applications.length === 0 && <div className="empty-state"><FiUserCheck /><p>No pending teacher applications.</p></div>}</div></section>}
      {tab === 'moderation' && <section className="atlas-panel p-6"><div className="flex items-center justify-between gap-4 mb-6"><h2>Community moderation</h2><select className="input max-w-xs" value={moderationResource} onChange={(event) => { const next = event.target.value as 'posts' | 'groups'; setModerationResource(next); loadContent(next) }}><option value="posts">Forum posts</option><option value="groups">Groups</option></select></div><div className="admin-table">{content.map((item: any) => <div className="admin-row" key={item._id}><div><strong>{item.title || item.name || 'Untitled item'}</strong><small>{item.category || moderationResource} {item.isPinned ? '· Pinned' : ''}</small></div>{moderationResource === 'posts' && <button onClick={() => togglePinnedPost(item)} className="icon-button" aria-label="Toggle pinned status"><FiCheck /></button>}<button onClick={() => removeContent(item._id)} className="icon-button danger" aria-label="Delete community item"><FiTrash2 /></button></div>)}{content.length === 0 && <div className="empty-state"><FiMessageSquare /><p>No moderation items.</p></div>}</div></section>}
      {courseModal !== false && <div className="modal-backdrop" role="presentation" onMouseDown={() => setCourseModal(false)}><div className="modal-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between mb-6"><div><p className="atlas-kicker">Curriculum editor</p><h2>{courseModal ? 'Edit course' : 'New course'}</h2></div><button onClick={() => setCourseModal(false)} className="icon-button" aria-label="Close"><FiX /></button></div><form onSubmit={saveCourseModal} className="space-y-4"><input className="input" required placeholder="Course title" value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} /><textarea className="input min-h-28" required placeholder="Description" value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} /><div className="grid grid-cols-2 gap-4"><select className="input" value={courseForm.language} onChange={(event) => setCourseForm({ ...courseForm, language: event.target.value })}><option>English</option><option>Turkish</option><option>Russian</option><option>Uzbek</option></select><select className="input" value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div><select className="input" value={courseForm.category} onChange={(event) => setCourseForm({ ...courseForm, category: event.target.value })}><option>Grammar</option><option>Vocabulary</option><option>Conversation</option><option>Reading</option><option>Writing</option><option>Listening</option></select><button className="btn btn-primary w-full">Save course</button></form></div></div>}
    </div>
  )
}
