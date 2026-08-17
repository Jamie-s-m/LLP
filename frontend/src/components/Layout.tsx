import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiLogOut, FiSettings } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        {isAuthenticated && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        <main
          className={`flex-1 transition-all duration-300 ${
            isAuthenticated && sidebarOpen ? 'md:ml-64' : ''
          }`}
        >
          {children}
        </main>
      </div>

      {/* Mobile menu backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
