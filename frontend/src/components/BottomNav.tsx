import { Link, useLocation } from 'react-router-dom'
import { FiGrid } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useI18n } from '../utils/i18n'
import { getNavSections, getAccountSection, getPrimaryMobilePaths } from '../utils/navSections'

const copy = {
  en: { more: 'More', home: 'Home', login: 'Login', courses: 'Courses', tutors: 'Tutors', forum: 'Forum' },
  ru: { more: 'Ещё', home: 'Главная', login: 'Войти', courses: 'Курсы', tutors: 'Репетиторы', forum: 'Форум' },
  uz: { more: 'Yana', home: 'Bosh sahifa', login: 'Kirish', courses: 'Kurslar', tutors: "O'qituvchilar", forum: 'Forum' },
} as const

export default function BottomNav() {
  const { isAuthenticated, user } = useAuthStore()
  const totalUnread = useChatStore((state) => state.totalUnread)
  const location = useLocation()
  const { t, language } = useI18n()
  const ui = copy[language]

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const publicAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

  // Hide bottom nav on auth screens and fullscreen lesson/exercise pages.
  // For guest users we keep a slim mobile nav so the app still feels like a native app shell.
  const isFullscreenPage = location.pathname.startsWith('/lesson/') || location.pathname.startsWith('/exercise/')
  if (publicAuthPaths.includes(location.pathname) || isFullscreenPage) return null

  let navItems: { label: string; path: string; icon: typeof FiGrid; badge: number }[]

  if (isAuthenticated) {
    // Primary tabs are role-aware and pulled from the same nav config Sidebar/More use, so
    // "Home" always matches this role's real landing page and nothing here can drift out of
    // sync with what "More" lists as the overflow.
    const allSections = [...getNavSections(user?.role, t), getAccountSection(t)]
    const allLinks = allSections.flatMap((section) => section.links)
    const primaryPaths = getPrimaryMobilePaths(user?.role)
    const primaryLinks = primaryPaths
      .map((path) => allLinks.find((link) => link.path === path))
      .filter((link): link is NonNullable<typeof link> => Boolean(link))

    navItems = [
      ...primaryLinks.map((link) => ({
        label: link.label,
        path: link.path,
        icon: link.icon,
        badge: link.path === '/chat' ? totalUnread : 0,
      })),
      { label: ui.more, path: '/more', icon: FiGrid, badge: 0 },
    ]
  } else {
    navItems = [
      { label: ui.home, path: '/', icon: FiGrid, badge: 0 },
      { label: ui.courses, path: '/courses', icon: FiGrid, badge: 0 },
      { label: ui.tutors, path: '/tutors', icon: FiGrid, badge: 0 },
      { label: ui.forum, path: '/forum', icon: FiGrid, badge: 0 },
      { label: ui.login, path: '/login', icon: FiGrid, badge: 0 },
    ]
  }

  return (
    <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)'}} className="fixed bottom-0 left-0 right-0 z-[130] block border-t border-[var(--border)] bg-[var(--surface)]/95 px-1.5 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-lg lg:hidden">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
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
