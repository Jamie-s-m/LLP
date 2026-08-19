import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
      // Robust error message extraction from Axios, backend payload, or thrown error
      const message =
        error.response?.data?.message ||
        error.message ||
        'Login failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-8">
            Sign in to your account to continue learning
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
              className="block text-sm text-primary-500 hover:text-primary-600"
            >
              Forgot Password?
            </Link>
            <p className="text-neutral-600 dark:text-neutral-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-600 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}