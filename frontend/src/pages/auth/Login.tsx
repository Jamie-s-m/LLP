import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Logged in successfully!')
      const role = useAuthStore.getState().user?.role
      const destination = role === 'admin'
        ? '/admin/control-center'
        : role === 'parent'
          ? '/parent/dashboard'
          : role === 'teacher'
            ? '/teacher/dashboard'
            : '/dashboard'
      navigate(destination)
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed'
      if (error.response?.status === 403 && error.response?.data?.data?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(error.response.data.data.email)}`)
      }
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="atlas-page flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="atlas-panel w-full max-w-md p-8"
      >
        <p className="atlas-kicker">Welcome back</p>
        <h1 className="text-3xl font-semibold text-ink mb-2">Sign in</h1>
        <p className="text-muted mb-8">
          Continue your streak and pick up where you left off.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            to="/forgot-password"
            className="block text-sm text-coral font-medium"
          >
            Forgot Password?
          </Link>
          <p className="text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-coral font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}