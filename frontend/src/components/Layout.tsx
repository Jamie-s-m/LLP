import { lazy, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMessageCircle } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import Footer from './Footer'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useI18n } from '../utils/i18n'

const ChatRealtimeBridge = lazy(() => import('./ChatRealtimeBridge'))

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuthStore()
  const totalUnread = useChatStore((state) => state.totalUnread)
  const location = useLocation()
  const { t } = useI18n()

  // Auth screens and the mobile-only "More" menu are compact, app-shell-style surfaces -
  // the marketing footer (and the mobile bottom-nav clearance padding, on auth screens)
  // don't belong there and only add scroll.
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname)
  const hideFooter = isAuthRoute || location.pathname === '/more'

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] dark:bg-[var(--dark-bg)] dark:text-[var(--dark-text-primary)]">
      {isAuthenticated ? <ChatRealtimeBridge /> : null}
      <Navbar />

      <div className="flex">
        {isAuthenticated ? <Sidebar /> : null}

        <main className={`flex-1 transition-all duration-300 pt-[68px] md:pt-0 lg:pt-0 ${isAuthRoute ? '' : 'pb-[112px] md:pb-0'}`}>
          {/* key remounts this div on every route change so the CSS enter animation restarts.
              This intentionally does NOT use framer-motion's AnimatePresence: AnimatePresence
              needs to track this node's mount/unmount synchronously to sequence its exit/enter
              animation, and a lazily-loaded route (React.lazy + Suspense) that suspends on its
              first render breaks that tracking - the page content froze on the previous route
              forever when this was AnimatePresence-driven. See index.css `.route-page-enter`. */}
          <div key={location.pathname} className="route-page-enter">
            {children}
          </div>
        </main>
      </div>

      {!hideFooter ? <Footer /> : null}

      {isAuthenticated && location.pathname !== '/chat' && !location.pathname.startsWith('/lesson/') && !location.pathname.startsWith('/exercise/') ? (
        <Link
          to="/chat"
          className="floating-chat-launcher hidden lg:inline-flex"
          aria-label={t('nav.openChat')}
          title={t('nav.openChat')}
        >
          <FiMessageCircle size={22} />
          {totalUnread > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{totalUnread > 99 ? '99+' : totalUnread}</span> : null}
        </Link>
      ) : null}
      {!isAuthRoute ? <BottomNav /> : null}
    </div>
  )
}
