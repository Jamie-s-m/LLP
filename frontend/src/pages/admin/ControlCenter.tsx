import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiBookOpen, FiCheck, FiCreditCard, FiEdit3, FiMessageSquare, FiPlus, FiTrash2, FiUserCheck, FiUsers, FiX } from 'react-icons/fi'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

type ModeratorPermissions = {
  communityModeration: boolean
  supportChat: boolean
  catalogContentQa: boolean
  limitedUserManagement: boolean
}

interface Course {
  _id: string
  title: string
  description?: string
  language: string
  level: string
  category?: string
  isPublished: boolean
  totalLessons: number
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'student' | 'teacher' | 'parent' | 'moderator' | 'admin'
  isActive: boolean
  isEmailVerified?: boolean
  moderatorPermissions?: ModeratorPermissions
}

interface Application {
  _id: string
  firstName: string
  lastName: string
  email: string
}

interface FamilyLinkRequest {
  _id: string
  status: 'pending' | 'approved' | 'rejected'
  parent?: { firstName: string; lastName: string; email: string }
  student?: { firstName: string; lastName: string; email: string }
}

interface BillingPlanStatus {
  key: string
  name: string
  priceLabel: string
  available: boolean
  description: string
}

interface CourseForm {
  title: string
  description: string
  language: string
  level: string
  category: string
}

interface Overview {
  totals: {
    users: number
    students: number
    teachers: number
    parents: number
    moderators: number
    admins: number
    courses: number
    publishedCourses: number
    lessons: number
    flashcards: number
    posts: number
    pinnedPosts: number
    groups: number
    pendingTeacherApplications: number
    approvedFamilyLinks: number
    chatConversations: number
    chatMessages: number
    enrollments: number
    completedEnrollments: number
  }
}

type ContentResource = 'lessons' | 'flashcards' | 'posts' | 'groups'
type ModerationResource = 'posts' | 'groups'
type Tab = 'courses' | 'users' | 'content' | 'applications' | 'moderation' | 'support' | 'billing'

type ManagedContent = {
  _id: string
  title?: string
  name?: string
  content?: string
  description?: string
  course?: string
  language?: string
  level?: string
  category?: string
  order?: number
  difficulty?: string
  isPinned?: boolean
  isPrivate?: boolean
  maxMembers?: number
  front?: { text?: string }
  back?: { text?: string }
}

type ContentForm = {
  title: string
  name: string
  description: string
  content: string
  course: string
  language: string
  level: string
  category: string
  order: string
  difficulty: string
  frontText: string
  backText: string
  maxMembers: string
  isPinned: boolean
  isPrivate: boolean
}

type UserForm = {
  role: User['role']
  isActive: boolean
  isEmailVerified: boolean
  moderatorPermissions: ModeratorPermissions
}

const emptyModeratorPermissions = (): ModeratorPermissions => ({
  communityModeration: false,
  supportChat: false,
  catalogContentQa: false,
  limitedUserManagement: false,
})

const emptyContentForm = (): ContentForm => ({
  title: '',
  name: '',
  description: '',
  content: '',
  course: '',
  language: 'English',
  level: 'Beginner',
  category: 'discussion',
  order: '1',
  difficulty: 'Easy',
  frontText: '',
  backText: '',
  maxMembers: '',
  isPinned: false,
  isPrivate: false,
})

export default function ControlCenter() {
  const currentUser = useAuthStore((state) => state.user)
  const [tab, setTab] = useState<Tab>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [resource, setResource] = useState<ContentResource>('lessons')
  const [content, setContent] = useState<ManagedContent[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [familyLinks, setFamilyLinks] = useState<FamilyLinkRequest[]>([])
  const [billingPlans, setBillingPlans] = useState<BillingPlanStatus[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [courseModal, setCourseModal] = useState<Course | null | false>(false)
  const [courseForm, setCourseForm] = useState<CourseForm>({ title: '', description: '', language: 'English', level: 'Beginner', category: 'Conversation' })
  const [userModal, setUserModal] = useState<User | null | false>(false)
  const [userForm, setUserForm] = useState<UserForm>({ role: 'student', isActive: true, isEmailVerified: false, moderatorPermissions: emptyModeratorPermissions() })
  const [contentModal, setContentModal] = useState<ManagedContent | null | false>(false)
  const [contentForm, setContentForm] = useState<ContentForm>(emptyContentForm())
  const [moderationResource, setModerationResource] = useState<ModerationResource>('posts')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const pageSize = 8

  const isAdmin = currentUser?.role === 'admin'
  const moderatorPermissions = currentUser?.moderatorPermissions || emptyModeratorPermissions()
  const canManageUsers = isAdmin || moderatorPermissions.limitedUserManagement
  const canManageCatalog = isAdmin || moderatorPermissions.catalogContentQa
  const canModerateCommunity = isAdmin || moderatorPermissions.communityModeration
  const canHandleSupport = isAdmin || moderatorPermissions.supportChat
  const canSeeBilling = isAdmin

  const availableTabs = useMemo<Tab[]>(() => {
    const nextTabs: Tab[] = []
    if (canManageCatalog) nextTabs.push('courses', 'content')
    if (canManageUsers) nextTabs.push('users', 'applications')
    if (canModerateCommunity) nextTabs.push('moderation')
    if (canHandleSupport) nextTabs.push('support')
    if (canSeeBilling) nextTabs.push('billing')
    return Array.from(new Set(nextTabs))
  }, [canHandleSupport, canManageCatalog, canManageUsers, canModerateCommunity, canSeeBilling])

  const currentContentResource = tab === 'moderation' ? moderationResource : resource

  const load = async () => {
    setLoading(true)
    try {
      const requests = [
        api.get('/courses'),
        canManageUsers ? api.get('/admin/users') : Promise.resolve({ data: { data: [] } }),
        api.get('/admin/overview'),
      ]
      const [courseResponse, userResponse, overviewResponse] = await Promise.all(requests)
      setCourses(courseResponse.data.data || courseResponse.data || [])
      setUsers(userResponse.data.data || [])
      setOverview(overviewResponse.data.data || null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Admin data could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!availableTabs.includes(tab) && availableTabs[0]) {
      setTab(availableTabs[0])
    }
  }, [availableTabs, tab])

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
    try {
      await api.delete(`/courses/${id}`)
      setCourses((current) => current.filter((course) => course._id !== id))
      toast.success('Course deleted')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Course could not be deleted')
    }
  }

  const openUserModal = (user: User) => {
    setUserModal(user)
    setUserForm({
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: Boolean(user.isEmailVerified),
      moderatorPermissions: {
        ...emptyModeratorPermissions(),
        ...(user.moderatorPermissions || {}),
      },
    })
  }

  const saveUserModal = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!userModal || typeof userModal === 'boolean') return
    try {
      await api.patch(`/admin/users/${userModal._id}`, userForm)
      setUserModal(false)
      await load()
      toast.success('User access updated')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'User could not be updated')
    }
  }

  const toggleUser = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user._id}`, { isActive: !user.isActive })
      setUsers((current) => current.map((item) => item._id === user._id ? { ...item, isActive: !item.isActive } : item))
      toast.success(user.isActive ? 'User suspended' : 'User reactivated')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'User could not be updated')
    }
  }

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/users/${user._id}`)
      setUsers((current) => current.filter((item) => item._id !== user._id))
      toast.success('User deleted')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'User could not be deleted')
    }
  }

  const loadContent = async (nextResource = currentContentResource) => {
    try {
      const response = await api.get(`/admin/content/${nextResource}`)
      setContent(response.data.data || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Content could not be loaded')
    }
  }

  const openContentModal = (item?: ManagedContent) => {
    setContentModal(item || null)
    const source: Partial<ManagedContent> = item || {}
    setContentForm({
      title: source.title || '',
      name: source.name || '',
      description: source.description || '',
      content: source.content || '',
      course: typeof source.course === 'string' ? source.course : '',
      language: source.language || 'English',
      level: source.level || 'Beginner',
      category: source.category || (currentContentResource === 'posts' ? 'discussion' : 'Conversation'),
      order: String(source.order || 1),
      difficulty: source.difficulty || 'Easy',
      frontText: source.front?.text || '',
      backText: source.back?.text || '',
      maxMembers: source.maxMembers ? String(source.maxMembers) : '',
      isPinned: Boolean(source.isPinned),
      isPrivate: Boolean(source.isPrivate),
    })
  }

  const buildContentPayload = () => {
    if (currentContentResource === 'lessons') {
      return {
        course: contentForm.course.trim(),
        title: contentForm.title.trim(),
        description: contentForm.description.trim(),
        content: contentForm.content.trim(),
        order: Number(contentForm.order) || 1,
        difficulty: contentForm.difficulty,
      }
    }
    if (currentContentResource === 'flashcards') {
      return {
        course: contentForm.course.trim(),
        language: contentForm.language,
        category: contentForm.category.trim(),
        difficulty: contentForm.difficulty,
        front: { text: contentForm.frontText.trim() },
        back: { text: contentForm.backText.trim() },
      }
    }
    if (currentContentResource === 'posts') {
      return {
        title: contentForm.title.trim(),
        content: contentForm.content.trim(),
        category: contentForm.category.trim(),
        isPinned: contentForm.isPinned,
      }
    }
    return {
      name: contentForm.name.trim(),
      description: contentForm.description.trim(),
      language: contentForm.language,
      level: contentForm.level,
      maxMembers: contentForm.maxMembers ? Number(contentForm.maxMembers) : undefined,
      isPrivate: contentForm.isPrivate,
    }
  }

  const saveContentModal = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const payload = buildContentPayload()
      if (contentModal && typeof contentModal !== 'boolean') {
        await api.patch(`/admin/content/${currentContentResource}/${contentModal._id}`, payload)
      } else {
        await api.post(`/admin/content/${currentContentResource}`, payload)
      }
      setContentModal(false)
      await loadContent(currentContentResource)
      toast.success('Content saved')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Content could not be saved')
    }
  }

  const removeContent = async (id: string) => {
    if (!window.confirm('Delete this content item?')) return
    try {
      await api.delete(`/admin/content/${currentContentResource}/${id}`)
      setContent((current) => current.filter((item) => item._id !== id))
      toast.success('Content deleted')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Content could not be deleted')
    }
  }

  const togglePinnedPost = async (item: ManagedContent) => {
    try {
      await api.patch(`/admin/content/posts/${item._id}`, { isPinned: !item.isPinned })
      setContent((current) => current.map((entry) => entry._id === item._id ? { ...entry, isPinned: !item.isPinned } : entry))
      toast.success(item.isPinned ? 'Post unpinned' : 'Post pinned')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Post could not be updated')
    }
  }

  const filteredUsers = users.filter((user) => `${user.firstName} ${user.lastName} ${user.email} ${user.role}`.toLowerCase().includes(userSearch.toLowerCase()))
  const visibleUsers = filteredUsers.slice((userPage - 1) * pageSize, userPage * pageSize)
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))

  const loadApplications = async () => {
    try {
      const [applicationResponse, familyResponse] = await Promise.all([
        api.get('/admin/teacher-applications'),
        api.get('/family'),
      ])
      setApplications(applicationResponse.data.data || [])
      setFamilyLinks((familyResponse.data.data || []).filter((link: FamilyLinkRequest) => link.status === 'pending'))
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Applications could not be loaded')
    }
  }

  const loadBillingPlans = async () => {
    try {
      const response = await api.get('/billing/plans')
      setBillingPlans(response.data.data?.plans || [])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Billing plans could not be loaded')
    }
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

  const reviewFamilyLink = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/family/${id}/review`, { status })
      setFamilyLinks((current) => current.filter((link) => link._id !== id))
      if (status === 'approved') {
        await load()
      }
      toast.success(status === 'approved' ? 'Family link approved' : 'Family link rejected')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Family link request could not be reviewed')
    }
  }

  const tabEntries = [
    canManageCatalog ? ['courses', FiBookOpen, 'Courses'] : null,
    canManageUsers ? ['users', FiUsers, 'People'] : null,
    canManageCatalog ? ['content', FiEdit3, 'Content'] : null,
    canManageUsers ? ['applications', FiUserCheck, 'Applications'] : null,
    canModerateCommunity ? ['moderation', FiMessageSquare, 'Moderation'] : null,
    canHandleSupport ? ['support', FiMessageSquare, 'Support'] : null,
    canSeeBilling ? ['billing', FiCreditCard, 'Billing'] : null,
  ].filter(Boolean) as Array<[Tab, typeof FiBookOpen, string]>

  return (
    <div className="atlas-page mx-auto max-w-7xl px-4 py-8">
      <div className="atlas-heading mb-8">
        <p className="atlas-kicker">Operations desk</p>
        <h1>Command the learning operation.</h1>
        <p>Manage people, curriculum, and community from one focused control center.</p>
      </div>

      {overview ? (
        <div className="atlas-stat-grid mb-8">
          {[
            ['Users', overview.totals.users],
            ['Courses', overview.totals.courses],
            ['Published', overview.totals.publishedCourses],
            ['Messages', overview.totals.chatMessages],
            ['Moderators', overview.totals.moderators],
            ['Pending teachers', overview.totals.pendingTeacherApplications],
          ].map(([label, value]) => <div key={String(label)} className="atlas-stat"><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      ) : null}

      <div className="admin-tabs mb-6">
        {tabEntries.map(([value, Icon, label]) => (
          <button
            key={value}
            onClick={() => {
              setTab(value)
              if (value === 'content') loadContent(resource)
              if (value === 'applications') loadApplications()
              if (value === 'moderation') loadContent(moderationResource)
              if (value === 'billing') loadBillingPlans()
            }}
            className={tab === value ? 'active' : ''}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {tab === 'courses' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6 flex flex-wrap justify-between gap-4">
            <div>
              <p className="atlas-kicker">Content inventory</p>
              <h2 className="text-2xl text-ink dark:text-white">Courses</h2>
            </div>
            <button onClick={() => openCourseModal()} className="btn btn-primary inline-flex items-center gap-2"><FiPlus /> New Course</button>
          </div>
          {loading ? (
            <div className="rounded-2xl bg-[#f6efe7] p-5 text-slate-600 dark:bg-white/5 dark:text-slate-300">Loading curriculum...</div>
          ) : (
            <div className="admin-table">
              {courses.map((course) => (
                <div className="admin-row" key={course._id}>
                  <div><strong>{course.title}</strong><small>{course.language} · {course.level} · {course.totalLessons || 0} lessons</small></div>
                  <span className={`status-pill ${course.isPublished ? '' : 'muted'}`}>{course.isPublished ? 'Published' : 'Draft'}</span>
                  <button onClick={() => openCourseModal(course)} className="icon-button" aria-label={`Edit ${course.title}`}><FiEdit3 /></button>
                  <button onClick={() => removeCourse(course._id)} className="icon-button danger" aria-label={`Delete ${course.title}`}><FiTrash2 /></button>
                </div>
              ))}
              {courses.length === 0 ? <div className="empty-state"><FiBookOpen /><p>No courses yet. Create your first course to populate the catalog.</p></div> : null}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'users' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6 flex flex-wrap justify-between gap-4">
            <h2 className="text-2xl text-ink dark:text-white">People & roles</h2>
            <input className="input max-w-sm" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1) }} placeholder="Search name, email, or role" />
          </div>
          <div className="admin-table">
            {visibleUsers.map((user) => {
              const protectedUser = user.role === 'admin' || user.role === 'moderator'
              return (
                <div className="admin-row" key={user._id}>
                  <div>
                    <strong>{user.firstName} {user.lastName}</strong>
                    <small>{user.email} · {user.role}{user.role === 'moderator' ? ' · scoped access' : ''}</small>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`status-pill ${user.isActive ? '' : 'muted'}`}>{user.isActive ? 'Active' : 'Suspended'}</span>
                    {isAdmin ? (
                      <>
                        <button onClick={() => openUserModal(user)} className="icon-button" aria-label={`Manage ${user.email}`}><FiEdit3 /></button>
                        {user._id !== currentUser?.id ? <button onClick={() => deleteUser(user)} className="icon-button danger" aria-label={`Delete ${user.email}`}><FiTrash2 /></button> : null}
                      </>
                    ) : (
                      <button onClick={() => toggleUser(user)} disabled={protectedUser} className="btn btn-outline text-sm">
                        {user.isActive ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {visibleUsers.length === 0 ? <div className="empty-state"><FiUsers /><p>{filteredUsers.length === 0 ? 'No users match this search yet.' : 'No users on this page.'}</p></div> : null}
          </div>
          <div className="mt-5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>{filteredUsers.length} users</span>
            <div className="flex gap-2">
              <button className="btn btn-outline" disabled={userPage === 1} onClick={() => setUserPage((page) => page - 1)}>Previous</button>
              <span className="px-3 py-2">{userPage} / {totalUserPages}</span>
              <button className="btn btn-outline" disabled={userPage === totalUserPages} onClick={() => setUserPage((page) => page + 1)}>Next</button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'content' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl text-ink dark:text-white">Content library</h2>
            <div className="flex flex-wrap gap-3">
              <select className="input max-w-xs" value={resource} onChange={(event) => { const next = event.target.value as ContentResource; setResource(next); loadContent(next) }}>
                <option value="lessons">Lessons</option>
                <option value="flashcards">Flashcards</option>
                <option value="posts">Forum posts</option>
                <option value="groups">Groups</option>
              </select>
              <button className="btn btn-primary inline-flex items-center gap-2" onClick={() => openContentModal()}><FiPlus /> Add item</button>
            </div>
          </div>
          <div className="admin-table">
            {content.map((item) => (
              <div className="admin-row" key={item._id}>
                <div><strong>{item.title || item.name || item.content?.slice(0, 70) || 'Untitled item'}</strong><small>{resource} · {item._id}</small></div>
                <div className="flex gap-2">
                  <button onClick={() => openContentModal(item)} className="icon-button" aria-label="Edit content"><FiEdit3 /></button>
                  <button onClick={() => removeContent(item._id)} className="icon-button danger" aria-label="Delete content"><FiTrash2 /></button>
                </div>
              </div>
            ))}
            {content.length === 0 ? <div className="empty-state"><FiEdit3 /><p>No items in this collection.</p></div> : null}
          </div>
        </section>
      ) : null}

      {tab === 'applications' ? (
        <section className="atlas-panel p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 text-2xl text-ink dark:text-white">Teacher applications</h2>
              <div className="admin-table">
                {applications.map((applicant) => (
                  <div className="admin-row" key={applicant._id}>
                    <div><strong>{applicant.firstName} {applicant.lastName}</strong><small>{applicant.email}</small></div>
                    <div className="flex gap-2">
                      <button onClick={() => reviewApplication(applicant._id, true)} className="icon-button" aria-label={`Approve ${applicant.email}`}><FiCheck /></button>
                      <button onClick={() => reviewApplication(applicant._id, false)} className="icon-button danger" aria-label={`Reject ${applicant.email}`}><FiX /></button>
                    </div>
                  </div>
                ))}
                {applications.length === 0 ? <div className="empty-state"><FiUserCheck /><p>No pending teacher applications.</p></div> : null}
              </div>
            </div>
            <div>
              <h2 className="mb-6 text-2xl text-ink dark:text-white">Family link requests</h2>
              <div className="admin-table">
                {familyLinks.map((link) => (
                  <div className="admin-row" key={link._id}>
                    <div>
                      <strong>{link.parent?.firstName} {link.parent?.lastName}</strong>
                      <small>{link.parent?.email} → {link.student?.firstName} {link.student?.lastName} ({link.student?.email})</small>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => reviewFamilyLink(link._id, 'approved')} className="icon-button" aria-label={`Approve family link for ${link.parent?.email}`}><FiCheck /></button>
                      <button onClick={() => reviewFamilyLink(link._id, 'rejected')} className="icon-button danger" aria-label={`Reject family link for ${link.parent?.email}`}><FiX /></button>
                    </div>
                  </div>
                ))}
                {familyLinks.length === 0 ? <div className="empty-state"><FiUsers /><p>No pending family link requests.</p></div> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'moderation' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl text-ink dark:text-white">Community moderation</h2>
            <div className="flex flex-wrap gap-3">
              <select className="input max-w-xs" value={moderationResource} onChange={(event) => { const next = event.target.value as ModerationResource; setModerationResource(next); loadContent(next) }}>
                <option value="posts">Forum posts</option>
                <option value="groups">Groups</option>
              </select>
              <button className="btn btn-primary inline-flex items-center gap-2" onClick={() => openContentModal()}><FiPlus /> Add item</button>
            </div>
          </div>
          <div className="admin-table">
            {content.map((item) => (
              <div className="admin-row" key={item._id}>
                <div><strong>{item.title || item.name || 'Untitled item'}</strong><small>{item.category || moderationResource} {item.isPinned ? '· Pinned' : ''}</small></div>
                <div className="flex gap-2">
                  {moderationResource === 'posts' ? <button onClick={() => togglePinnedPost(item)} className="icon-button" aria-label="Toggle pinned status"><FiCheck /></button> : null}
                  <button onClick={() => openContentModal(item)} className="icon-button" aria-label="Edit community item"><FiEdit3 /></button>
                  <button onClick={() => removeContent(item._id)} className="icon-button danger" aria-label="Delete community item"><FiTrash2 /></button>
                </div>
              </div>
            ))}
            {content.length === 0 ? <div className="empty-state"><FiMessageSquare /><p>No moderation items.</p></div> : null}
          </div>
        </section>
      ) : null}

      {tab === 'support' ? (
        <section className="atlas-panel p-6">
          <p className="atlas-kicker">Support coverage</p>
          <h2 className="text-2xl text-ink dark:text-white">Support and chat operations</h2>
          <p className="mt-2 text-muted">Users opening support conversations are routed to active admin and moderator support staff. Use the chat workspace to respond.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f6efe7] p-5 dark:bg-white/5">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Current chat volume</p>
              <strong className="mt-3 block text-3xl text-ink dark:text-white">{overview?.totals.chatMessages ?? 0}</strong>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Total support and conversation messages in the platform.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Operational action</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use the chat workspace to reply to support conversations and keep resolution times low.</p>
              <Link to="/chat" className="btn btn-primary mt-4 inline-flex">Open support chat</Link>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'billing' ? (
        <section className="atlas-panel p-6">
          <div className="mb-6">
            <p className="atlas-kicker">Commercial controls</p>
            <h2 className="text-2xl text-ink dark:text-white">Stripe billing operation</h2>
            <p className="mt-2 text-muted">Monitor plan readiness, account mix, and go-live billing actions from one place.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: 'Potential learner seats', value: overview?.totals.students ?? 0, note: 'Current student accounts that could map to paid seats.' },
              { title: 'Potential family accounts', value: overview?.totals.parents ?? 0, note: 'Parent users available for family subscriptions.' },
              { title: 'Potential teaching workspaces', value: overview?.totals.teachers ?? 0, note: 'Teacher accounts that could map to team or academy plans.' },
            ].map((card) => <div key={card.title} className="rounded-2xl bg-[#f6efe7] p-5 dark:bg-white/5"><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{card.title}</p><strong className="mt-3 block text-3xl text-ink dark:text-white">{card.value}</strong><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{card.note}</p></div>)}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {billingPlans.map((plan) => (
              <div key={plan.key} className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{plan.name}</p>
                    <strong className="mt-2 block text-2xl text-ink dark:text-white">{plan.priceLabel}</strong>
                  </div>
                  <span className={`status-pill ${plan.available ? '' : 'muted'}`}>{plan.available ? 'configured' : 'missing price ID'}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
              </div>
            ))}
            {billingPlans.length === 0 ? <div className="empty-state lg:col-span-3"><FiCreditCard /><p>No Stripe plan metadata loaded yet.</p></div> : null}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and all plan price IDs in the backend environment.',
              'Enable Stripe customer portal plan changes, cancellations, and invoice emails.',
              'Define taxes, refunds, failed-payment handling, and cancellation policy ownership.',
              'Add finance monitoring, support ownership, and billing incident alerts.',
            ].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">{item}</div>)}
          </div>
        </section>
      ) : null}

      {courseModal !== false ? (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/45 px-4">
          <form className="atlas-panel w-full max-w-2xl p-6" onSubmit={saveCourseModal}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl text-ink dark:text-white">{courseModal ? 'Edit course' : 'New course'}</h2>
              <button type="button" className="icon-button" onClick={() => setCourseModal(false)} aria-label="Close course modal"><FiX /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2"><label className="label">Title</label><input className="input" value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))} required /></div>
              <div className="md:col-span-2"><label className="label">Description</label><textarea className="input min-h-28" value={courseForm.description} onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))} required /></div>
              <div><label className="label">Language</label><select className="input" value={courseForm.language} onChange={(event) => setCourseForm((current) => ({ ...current, language: event.target.value }))}><option>English</option><option>Turkish</option><option>Russian</option><option>Uzbek</option></select></div>
              <div><label className="label">Level</label><select className="input" value={courseForm.level} onChange={(event) => setCourseForm((current) => ({ ...current, level: event.target.value }))}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
              <div className="md:col-span-2"><label className="label">Category</label><select className="input" value={courseForm.category} onChange={(event) => setCourseForm((current) => ({ ...current, category: event.target.value }))}><option>Conversation</option><option>Grammar</option><option>Vocabulary</option><option>Reading</option><option>Writing</option><option>Listening</option></select></div>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-outline" onClick={() => setCourseModal(false)}>Cancel</button><button className="btn btn-primary">{courseModal ? 'Save course' : 'Create course'}</button></div>
          </form>
        </div>
      ) : null}

      {userModal && isAdmin ? (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/45 px-4">
          <form className="atlas-panel w-full max-w-2xl p-6" onSubmit={saveUserModal}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl text-ink dark:text-white">Manage user access</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{userModal.email}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setUserModal(false)} aria-label="Close user modal"><FiX /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">Role</label><select className="input" value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as User['role'] }))}><option value="student">Student</option><option value="parent">Parent</option><option value="teacher">Teacher</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select></div>
              <div className="space-y-3 rounded-2xl bg-[#f6efe7] p-4 dark:bg-white/5">
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={userForm.isActive} onChange={(event) => setUserForm((current) => ({ ...current, isActive: event.target.checked }))} /> Active account</label>
                <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={userForm.isEmailVerified} onChange={(event) => setUserForm((current) => ({ ...current, isEmailVerified: event.target.checked }))} /> Email verified</label>
              </div>
            </div>
            {userForm.role === 'moderator' ? (
              <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-white/10">
                <h3 className="text-lg font-semibold text-ink dark:text-white">Moderator scopes</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    ['communityModeration', 'Community moderation'],
                    ['supportChat', 'Support and chat'],
                    ['catalogContentQa', 'Catalog and content QA'],
                    ['limitedUserManagement', 'Limited user management'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl bg-[#f6efe7] p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
                      <input type="checkbox" checked={userForm.moderatorPermissions[key as keyof ModeratorPermissions]} onChange={(event) => setUserForm((current) => ({ ...current, moderatorPermissions: { ...current.moderatorPermissions, [key]: event.target.checked } }))} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-outline" onClick={() => setUserModal(false)}>Cancel</button><button className="btn btn-primary">Save access</button></div>
          </form>
        </div>
      ) : null}

      {contentModal !== false ? (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/45 px-4">
          <form className="atlas-panel w-full max-w-3xl p-6" onSubmit={saveContentModal}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl text-ink dark:text-white">{contentModal ? 'Edit content item' : 'Create content item'}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{currentContentResource}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setContentModal(false)} aria-label="Close content modal"><FiX /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {currentContentResource === 'lessons' ? (
                <>
                  <div><label className="label">Course ID</label><input className="input" value={contentForm.course} onChange={(event) => setContentForm((current) => ({ ...current, course: event.target.value }))} required /></div>
                  <div><label className="label">Order</label><input className="input" type="number" min="1" value={contentForm.order} onChange={(event) => setContentForm((current) => ({ ...current, order: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">Title</label><input className="input" value={contentForm.title} onChange={(event) => setContentForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">Description</label><textarea className="input min-h-24" value={contentForm.description} onChange={(event) => setContentForm((current) => ({ ...current, description: event.target.value }))} /></div>
                  <div className="md:col-span-2"><label className="label">Content</label><textarea className="input min-h-32" value={contentForm.content} onChange={(event) => setContentForm((current) => ({ ...current, content: event.target.value }))} required /></div>
                  <div><label className="label">Difficulty</label><select className="input" value={contentForm.difficulty} onChange={(event) => setContentForm((current) => ({ ...current, difficulty: event.target.value }))}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                </>
              ) : null}

              {currentContentResource === 'flashcards' ? (
                <>
                  <div><label className="label">Course ID</label><input className="input" value={contentForm.course} onChange={(event) => setContentForm((current) => ({ ...current, course: event.target.value }))} required /></div>
                  <div><label className="label">Language</label><select className="input" value={contentForm.language} onChange={(event) => setContentForm((current) => ({ ...current, language: event.target.value }))}><option>English</option><option>Turkish</option><option>Russian</option><option>Uzbek</option></select></div>
                  <div className="md:col-span-2"><label className="label">Front text</label><input className="input" value={contentForm.frontText} onChange={(event) => setContentForm((current) => ({ ...current, frontText: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">Back text</label><input className="input" value={contentForm.backText} onChange={(event) => setContentForm((current) => ({ ...current, backText: event.target.value }))} required /></div>
                  <div><label className="label">Category</label><input className="input" value={contentForm.category} onChange={(event) => setContentForm((current) => ({ ...current, category: event.target.value }))} /></div>
                  <div><label className="label">Difficulty</label><select className="input" value={contentForm.difficulty} onChange={(event) => setContentForm((current) => ({ ...current, difficulty: event.target.value }))}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                </>
              ) : null}

              {currentContentResource === 'posts' ? (
                <>
                  <div className="md:col-span-2"><label className="label">Title</label><input className="input" value={contentForm.title} onChange={(event) => setContentForm((current) => ({ ...current, title: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">Content</label><textarea className="input min-h-32" value={contentForm.content} onChange={(event) => setContentForm((current) => ({ ...current, content: event.target.value }))} required /></div>
                  <div><label className="label">Category</label><select className="input" value={contentForm.category} onChange={(event) => setContentForm((current) => ({ ...current, category: event.target.value }))}><option>discussion</option><option>question</option><option>resource</option><option>event</option></select></div>
                  <label className="flex items-center gap-3 rounded-2xl bg-[#f6efe7] p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200"><input type="checkbox" checked={contentForm.isPinned} onChange={(event) => setContentForm((current) => ({ ...current, isPinned: event.target.checked }))} /> Pin this post</label>
                </>
              ) : null}

              {currentContentResource === 'groups' ? (
                <>
                  <div className="md:col-span-2"><label className="label">Group name</label><input className="input" value={contentForm.name} onChange={(event) => setContentForm((current) => ({ ...current, name: event.target.value }))} required /></div>
                  <div className="md:col-span-2"><label className="label">Description</label><textarea className="input min-h-24" value={contentForm.description} onChange={(event) => setContentForm((current) => ({ ...current, description: event.target.value }))} required /></div>
                  <div><label className="label">Language</label><select className="input" value={contentForm.language} onChange={(event) => setContentForm((current) => ({ ...current, language: event.target.value }))}><option>English</option><option>Turkish</option><option>Russian</option><option>Uzbek</option></select></div>
                  <div><label className="label">Level</label><select className="input" value={contentForm.level} onChange={(event) => setContentForm((current) => ({ ...current, level: event.target.value }))}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                  <div><label className="label">Max members</label><input className="input" type="number" min="1" value={contentForm.maxMembers} onChange={(event) => setContentForm((current) => ({ ...current, maxMembers: event.target.value }))} /></div>
                  <label className="flex items-center gap-3 rounded-2xl bg-[#f6efe7] p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200"><input type="checkbox" checked={contentForm.isPrivate} onChange={(event) => setContentForm((current) => ({ ...current, isPrivate: event.target.checked }))} /> Private group</label>
                </>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn btn-outline" onClick={() => setContentModal(false)}>Cancel</button><button className="btn btn-primary">{contentModal ? 'Save item' : 'Create item'}</button></div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
