import { Link, useLocation } from 'react-router-dom'
import {
  FiHome,
  FiBook,
  FiZap,
  FiMessageCircle,
  FiUser,
  FiCalendar,
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useI18n } from '../utils/i18n'

export default function BottomNav() {
  const { isAuthenticated, user } = useAuthStore()
  const totalUnread = useChatStore((state) => state.totalUnread)
  const location = useLocation()
  const { t } = useI18n()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const publicAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

  // Hide bottom nav on auth screens and fullscreen lesson/exercise pages.
  // For guest users we keep a slim mobile nav so the app still feels like a native app shell.
  const isFullscreenPage = location.pathname.startsWith('/lesson/') || location.pathname.startsWith('/exercise/')
  if (publicAuthPaths.includes(location.pathname) || isFullscreenPage) return null

  // Determine home landing page based on role
  const homePath = isAuthenticated
    ? user?.role === 'admin' || user?.role === 'moderator'
      ? '/admin/control-center'
      : user?.role === 'teacher'
        ? '/teacher/dashboard'
        : user?.role === 'parent'
          ? '/parent/dashboard'
          : '/dashboard'
    : '/'

  const navItems = isAuthenticated
    ? [
        {
          label: t('nav.home'),
          path: homePath,
          icon: FiHome,
          badge: 0,
        },
        {
          label: t('sidebar.progress') || t('sidebar.myLearning'),
          path: user?.role === 'student' ? '/my-learning' : '/courses',
          icon: FiBook,
          badge: 0,
        },
        {
          label: t('mobileNav.timetable') || 'Schedule',
          path: '/schedule',
          icon: FiCalendar,
          badge: 0,
        },
        {
          label: t('mobileNav.practice') || 'Practice',
          path: '/flashcards',
          icon: FiZap,
          badge: 0,
        },
        {
          label: t('sidebar.chat'),
          path: '/chat',
          icon: FiMessageCircle,
          badge: totalUnread,
        },
        {
          label: t('nav.profile'),
          path: '/profile',
          icon: FiUser,
          badge: 0,
        },
      ]
    : [
        {
          label: t('nav.home'),
          path: '/',
          icon: FiHome,
          badge: 0,
        },
        {
          label: t('nav.courses'),
          path: '/courses',
          icon: FiBook,
          badge: 0,
        },
        {
          label: 'Tutors',
          path: '/tutors',
          icon: FiUser,
          badge: 0,
        },
        {
          label: t('nav.forum'),
          path: '/forum',
          icon: FiMessageCircle,
          badge: 0,
        },
        {
          label: 'Login',
          path: '/login',
          icon: FiUser,
          badge: 0,
        },
      ]

  const navByKey = (item: { path: string; label: string }) => `${item.path}-${item.label}`

  return (
    <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)'}} className="fixed bottom-0 left-0 right-0 z-[130] block md:hidden border-t border-neutral-200/80 bg-white/95 px-1.5 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-lg dark:border-neutral-800 dark:bg-[rgba(16,24,36,0.75)]">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={navByKey(item)}
              to={item.path}
              className={`relative flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[56px] min-h-[56px] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-400 ${
                active
                  ? 'text-primary-600 dark:text-primary-400 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={active ? 'stroke-[2.5]' : 'stroke-2'} />
                {item.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[10px] leading-tight tracking-tight truncate max-w-[72px]">
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 h-1 w-4 rounded-full bg-primary-500 dark:bg-primary-400 animate-fadeIn" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}