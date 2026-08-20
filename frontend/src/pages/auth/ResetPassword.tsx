import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success('Password updated successfully')
      navigate('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to reset password')
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
        <p className="atlas-kicker">Account recovery</p>
        <h1 className="mb-2 text-3xl font-semibold text-ink">Create a new password</h1>
        <p className="mb-8 text-muted">Choose a strong password with at least 8 characters.</p>

        {!token ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This reset link is incomplete or missing. Request a new password reset email to continue.
            </div>
            <Link to="/forgot-password" className="btn btn-primary inline-block w-full text-center">Request reset link</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
            </div>
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? 'Saving...' : 'Reset password'}</button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-muted">Back to Sign In</Link>
        </div>
      </motion.div>
    </div>
  )
}
