import { Link, useLocation } from 'react-router-dom'
import {
  FiBook,
  FiChevronLeft,
  FiUsers,
  FiMessageSquare,
  FiAward,
  FiSettings,
  FiGrid,
  FiEdit3,
  FiTrendingUp,
  FiMessageCircle,
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  const workspaceTitle = user?.role === 'admin'
    ? 'Admin workspace'
    : user?.role === 'teacher'
      ? 'Teacher workspace'
      : user?.role === 'parent'
        ? 'Parent workspace'
        : 'Student workspace'

  const isActive = (path: string) => location.pathname.startsWith(path)

  const navClasses = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      isActive(path)
        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold'
        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
    }`

  const studentLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { label: 'My Learning', path: '/my-learning', icon: FiBook },
    { label: 'Flashcards', path: '/flashcards', icon: FiAward },
    { label: 'Groups', path: '/groups', icon: FiUsers },
    { label: 'Leaderboard', path: '/leaderboard', icon: FiTrendingUp },
  ]

  const parentLinks = [
    { label: 'Family Desk', path: '/parent/dashboard', icon: FiGrid },
    { label: 'Chat', path: '/chat', icon: FiMessageCircle },
  ]

  const teacherLinks = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: FiGrid },
    { label: 'Create Course', path: '/teacher/create-course', icon: FiEdit3 },
    { label: 'My Courses', path: '/teacher/courses', icon: FiBook },
  ]

  const adminLinks = [
    { label: 'Control Center', path: '/admin/control-center', icon: FiGrid },
  ]

  let navLinks = studentLinks
  if (user?.role === 'teacher') navLinks = teacherLinks
  if (user?.role === 'parent') navLinks = parentLinks
  if (user?.role === 'admin') navLinks = [...adminLinks, ...teacherLinks]

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[150] w-[min(20rem,90vw)] overflow-y-auto border-r border-neutral-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.28)] transition-transform dark:border-neutral-700 dark:bg-neutral-800 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-hidden={!open}
    >
        <div className="p-5 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Workspace</p>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{workspaceTitle}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
              aria-label="Close navigation menu"
            >
              <FiChevronLeft size={20} />
            </button>
          </div>
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={navClasses(link.path)}
                  onClick={() => onClose()}
                >
                  <Icon size={20} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          <hr className="my-6 border-neutral-200 dark:border-neutral-700" />

          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Other
          </h3>
          <nav className="space-y-2">
            <Link
              to="/forum"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive('/forum')
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
              onClick={() => onClose()}
            >
              <FiMessageSquare size={20} />
              <span>Forum</span>
            </Link>
            <Link
              to="/chat"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/chat') ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
              onClick={() => onClose()}
            >
              <FiMessageCircle size={20} />
              <span>Chat</span>
            </Link>
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive('/profile')
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
              onClick={() => onClose()}
            >
              <FiSettings size={20} />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      </aside>
  )
}
