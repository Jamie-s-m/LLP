import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const response = await api.post('/auth/forgot-password', { email: normalizedEmail })
      toast.success('Reset link sent to your email!')
      setPreviewUrl(response.data.data?.previewUrl || '')
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
            {previewUrl ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                SMTP is not configured in this environment yet. For development only, you can open the reset link directly:{' '}
                <a href={previewUrl} className="break-all font-semibold underline">{previewUrl}</a>
              </div>
            ) : null}
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
                autoComplete="email"
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