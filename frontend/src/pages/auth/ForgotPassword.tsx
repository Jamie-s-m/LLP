import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Clean API base URL fallback matching your app setup
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const API_URL = rawApiUrl.replace(/[\[\]'"]+/g, '').replace(/\/+$/, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email })
      toast.success('Reset link sent to your email!')
      setSubmitted(true)
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send reset link'
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
        className="atlas-panel w-full max-w-md p-8 text-center"
      >
        <p className="atlas-kicker">Account recovery</p>
        <h1 className="text-3xl font-semibold text-ink mb-2">Forgot password</h1>
        <p className="text-muted mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
              If an account exists for <strong>{email}</strong>, a password reset link has been dispatched.
            </div>
            <Link to="/login" className="btn btn-primary w-full inline-block">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                className="input"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-6">
          <Link
            to="/login"
            className="text-sm text-muted"
          >
            ← Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  )
}