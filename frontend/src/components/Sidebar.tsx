import { Link, useLocation } from 'react-router-dom'
import {
  FiBook,
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
    <>
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 overflow-y-auto transition-all z-40 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-6">
            Navigation
          </h2>
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
    </>
  )
}
