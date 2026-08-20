import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiBell, FiBellOff, FiChevronDown, FiGrid, FiLogOut, FiMessageCircle, FiSettings, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { enablePushNotifications, getNotificationPermission, isPushSupported } from '../utils/push'
import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const { isAuthenticated, user, logout } = useAuthStore()
  const { totalUnread, fetchUnreadSummary } = useChatStore()
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const isTopNavActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path))

  const topNavClasses = (path: string) =>
    `rounded-full px-2.5 py-2 text-sm font-medium transition xl:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-800 ${
      isTopNavActive(path)
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
        : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-500 dark:text-neutral-300 dark:hover:bg-neutral-700/80 dark:hover:text-white'
    }`

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''
  const dashboardConfig = user?.role === 'admin'
    ? { to: '/admin/control-center', label: 'Control Center' }
    : user?.role === 'moderator'
      ? { to: '/admin/control-center', label: 'Moderation Desk' }
    : user?.role === 'teacher'
      ? { to: '/teacher/dashboard', label: 'Teaching Dashboard' }
      : user?.role === 'parent'
        ? { to: '/parent/dashboard', label: 'Family Desk' }
        : { to: '/dashboard', label: 'Learner Dashboard' }

  useEffect(() => {
    if (isAuthenticated) setNotifPermission(getNotificationPermission())
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    let timer: number | undefined

    const syncUnreadSummary = () => {
      if (document.visibilityState !== 'visible') return
      fetchUnreadSummary()
    }

    const startPolling = () => {
      if (timer) window.clearInterval(timer)
      if (document.visibilityState === 'visible') {
        timer = window.setInterval(syncUnreadSummary, 30000)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncUnreadSummary()
        startPolling()
        return
      }

      if (timer) {
        window.clearInterval(timer)
        timer = undefined
      }
    }

    syncUnreadSummary()
    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', syncUnreadSummary)

    return () => {
      if (timer) window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', syncUnreadSummary)
    }
  }, [fetchUnreadSummary, isAuthenticated])

  useEffect(() => {
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!dropdownOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [dropdownOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleEnableNotifications = async () => {
    const enabled = await enablePushNotifications()
    setNotifPermission(getNotificationPermission())
    if (enabled) {
      toast.success('Notifications enabled for chat and updates')
    } else {
      toast.error('Notifications were not enabled')
    }
  }

  return (
    <nav className="relative z-[120] border-b border-neutral-200 bg-white/90 shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-800/90">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 xl:gap-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}linguanest-mark.svg`} alt="LinguaNest" className="w-8 h-8 rounded-lg" />
          <span className="hidden sm:inline font-bold text-xl text-neutral-900 dark:text-white">
            LinguaNest
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden flex-1 items-center justify-center gap-2 lg:flex xl:gap-4">
          <Link to="/" className={topNavClasses('/')} title="Go to home">
            Home
          </Link>
          <Link to="/courses" className={topNavClasses('/courses')} title="Browse courses">
            Courses
          </Link>
          <Link to="/forum" className={topNavClasses('/forum')} title="Open forum">
            Forum
          </Link>
          <Link to="/pricing" className={topNavClasses('/pricing')} title="View pricing">
            Pricing
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <Link
              to="/chat"
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
              aria-label="Open chat"
              title="Open chat"
            >
              <FiMessageCircle size={18} />
              {totalUnread > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{totalUnread > 99 ? '99+' : totalUnread}</span> : null}
            </Link>
          ) : null}
          {isAuthenticated && isPushSupported() && notifPermission !== 'granted' ? (
            <button
              onClick={handleEnableNotifications}
              className="rounded-full p-2 text-neutral-500 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
              aria-label="Enable notifications"
              title="Enable notifications for chat and updates"
            >
              <FiBellOff size={20} />
            </button>
          ) : null}
          {isAuthenticated && notifPermission === 'granted' ? (
            <span className="rounded-full p-2 text-primary-500" title="Notifications enabled">
              <FiBell size={20} />
            </span>
          ) : null}
          <ThemeToggle />
          {isAuthenticated ? (
            <button
              onClick={onMenuClick}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
              aria-label="Open workspace menu"
              title="Open workspace navigation"
            >
              <FiGrid size={18} />
              <span className="hidden xl:inline">Workspace</span>
            </button>
          ) : null}
          {isAuthenticated ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1.5 text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 dark:focus-visible:ring-offset-neutral-800"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                title="Open account menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                  {user?.firstName?.charAt(0)}
                </div>
                <div className="hidden min-w-0 xl:block">
                  <span className="block max-w-24 truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {user?.firstName}
                  </span>
                  <span className="block text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {roleLabel}
                  </span>
                </div>
                <FiChevronDown className={`hidden xl:block transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} size={16} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 z-[140] mt-2 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800 sm:w-64" role="menu">
                  <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                    <span className="mt-2 inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                      {roleLabel}
                    </span>
                  </div>
                  <Link
                    to={dashboardConfig.to}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FiGrid size={16} /> {dashboardConfig.label}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FiUser size={16} /> Profile
                  </Link>
                  {user?.role === 'teacher' || user?.role === 'admin' ? (
                    <Link
                      to="/teacher/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FiSettings size={16} /> Teaching
                    </Link>
                  ) : null}
                  {user?.role === 'moderator' ? (
                    <Link
                      to="/admin/control-center"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FiSettings size={16} /> Moderation
                    </Link>
                  ) : null}
                  {user?.role === 'admin' ? (
                    <Link
                      to="/admin/control-center"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FiSettings size={16} /> Admin
                    </Link>
                  ) : null}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-neutral-200 dark:border-neutral-700"
                  >
                    <FiLogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="btn btn-outline text-sm px-3 py-1.5"
              >
                Login
              </Link>
              <Link to="/register" className="btn btn-primary text-sm px-3 py-1.5">
                Sign Up
              </Link>
            </div>
          )}

        </div>
      </div>
    </nav>
  )
}
