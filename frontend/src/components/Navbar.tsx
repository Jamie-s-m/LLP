import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiBell, FiBellOff, FiMenu, FiLogOut, FiSettings, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { enablePushNotifications, getNotificationPermission, isPushSupported } from '../utils/push'

interface NavbarProps {
  onMenuClick: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) setNotifPermission(getNotificationPermission())
  }, [isAuthenticated])

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
    <nav className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}linguanest-mark.svg`} alt="LinguaNest" className="w-8 h-8 rounded-lg" />
          <span className="hidden sm:inline font-bold text-xl text-neutral-900 dark:text-white">
            LinguaNest
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-500">
            Home
          </Link>
          <Link to="/courses" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-500">
            Courses
          </Link>
          <Link to="/forum" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-500">
            Forum
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {isAuthenticated && isPushSupported() && notifPermission !== 'granted' ? (
            <button
              onClick={handleEnableNotifications}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500"
              aria-label="Enable notifications"
              title="Enable notifications for chat and updates"
            >
              <FiBellOff size={20} />
            </button>
          ) : null}
          {isAuthenticated && notifPermission === 'granted' ? (
            <span className="p-2 text-primary-500" title="Notifications enabled">
              <FiBell size={20} />
            </span>
          ) : null}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                  {user?.firstName?.charAt(0)}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-neutral-900 dark:text-white">
                  {user?.firstName}
                </span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FiUser size={16} /> Profile
                  </Link>
                  {user?.role === 'teacher' || user?.role === 'admin' ? (
                    <Link
                      to="/teacher/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FiSettings size={16} /> Teaching
                    </Link>
                  ) : null}
                  {user?.role === 'admin' ? (
                    <Link
                      to="/admin/control-center"
                      className="flex items-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FiSettings size={16} /> Admin
                    </Link>
                  ) : null}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-neutral-200 dark:border-neutral-700"
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
              <Link
                to="/register"
                className="btn btn-primary text-sm px-3 py-1.5"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <FiMenu size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}
