import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { FiMessageCircle } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import Footer from './Footer'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ChatRealtimeBridge from './ChatRealtimeBridge'
import { useI18n } from '../utils/i18n'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const totalUnread = useChatStore((state) => state.totalUnread)
  const location = useLocation()
  const { t } = useI18n()

  React.useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {isAuthenticated ? <ChatRealtimeBridge /> : null}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {isAuthenticated ? <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /> : null}

        <main className="flex-1 transition-all duration-300">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 18, rotateX: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, rotateX: -6, scale: 0.99 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{ transformPerspective: 1200 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Footer />

      {/* Mobile menu backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[140] bg-black/45 backdrop-blur-[1px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {isAuthenticated && location.pathname !== '/chat' ? (
        <Link
          to="/chat"
          className="floating-chat-launcher lg:hidden"
          aria-label={t('nav.openChat')}
          title={t('nav.openChat')}
        >
          <FiMessageCircle size={22} />
          {totalUnread > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-coral px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{totalUnread > 99 ? '99+' : totalUnread}</span> : null}
        </Link>
      ) : null}
    </div>
  )
}
