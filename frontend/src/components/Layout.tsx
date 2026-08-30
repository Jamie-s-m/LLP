import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { FiMessageCircle } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import Footer from './Footer'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import ChatRealtimeBridge from './ChatRealtimeBridge'
import { useI18n } from '../utils/i18n'

interface LayoutProps {
  children: React.ReactNode
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
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
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
