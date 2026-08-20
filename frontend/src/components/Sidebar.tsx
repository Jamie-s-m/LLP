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
import { useI18n } from '../utils/i18n'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  const { t } = useI18n()
  const workspaceTitle = user?.role === 'admin'
    ? t('sidebar.adminWorkspace')
    : user?.role === 'moderator'
      ? t('sidebar.moderatorWorkspace')
    : user?.role === 'teacher'
      ? t('sidebar.teacherWorkspace')
      : user?.role === 'parent'
        ? t('sidebar.parentWorkspace')
        : t('sidebar.studentWorkspace')

  const isActive = (path: string) => location.pathname.startsWith(path)

  const navClasses = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      isActive(path)
        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold'
        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
    }`

  const studentLinks = [
    { label: t('sidebar.dashboard'), path: '/dashboard', icon: FiGrid },
    { label: t('sidebar.myLearning'), path: '/my-learning', icon: FiBook },
    { label: t('sidebar.flashcards'), path: '/flashcards', icon: FiAward },
    { label: t('sidebar.groups'), path: '/groups', icon: FiUsers },
    { label: t('sidebar.leaderboard'), path: '/leaderboard', icon: FiTrendingUp },
  ]

  const parentLinks = [
    { label: t('sidebar.familyDesk'), path: '/parent/dashboard', icon: FiGrid },
    { label: t('sidebar.chat'), path: '/chat', icon: FiMessageCircle },
  ]

  const teacherLinks = [
    { label: t('sidebar.dashboard'), path: '/teacher/dashboard', icon: FiGrid },
    { label: t('sidebar.createCourse'), path: '/teacher/create-course', icon: FiEdit3 },
    { label: t('sidebar.myCourses'), path: '/teacher/courses', icon: FiBook },
  ]

  const adminLinks = [
    { label: t('sidebar.controlCenter'), path: '/admin/control-center', icon: FiGrid },
  ]

  const moderatorLinks = [
    { label: t('sidebar.moderationDesk'), path: '/admin/control-center', icon: FiGrid },
  ]

  let navLinks = studentLinks
  if (user?.role === 'teacher') navLinks = teacherLinks
  if (user?.role === 'parent') navLinks = parentLinks
  if (user?.role === 'moderator') navLinks = moderatorLinks
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">{t('common.workspace')}</p>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{workspaceTitle}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
              aria-label={t('sidebar.closeMenu')}
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
            {t('common.other')}
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
              <span>{t('sidebar.forum')}</span>
            </Link>
            <Link
              to="/chat"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive('/chat') ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-semibold' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
              onClick={() => onClose()}
            >
              <FiMessageCircle size={20} />
              <span>{t('sidebar.chat')}</span>
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
              <span>{t('sidebar.settings')}</span>
            </Link>
          </nav>
        </div>
      </aside>
  )
}
