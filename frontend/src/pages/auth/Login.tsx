import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const notice = searchParams.get('verified') === '1'
    ? 'Email verified. You can sign in now.'
    : searchParams.get('reset') === '1'
      ? 'Password updated. Sign in with your new password.'
      : searchParams.get('registered') === '1'
        ? 'Account created. Check your email for a verification link before signing in.'
        : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      await login(normalizedEmail, password)
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
        {notice ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-11"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
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