import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBookOpen, FiUsers } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import toast from 'react-hot-toast'

type SignupRole = 'student' | 'parent'

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [role, setRole] = useState<SignupRole>('student')
  const [requestTeacherRole, setRequestTeacherRole] = useState(false)
  const [localError, setLocalError] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle')
  const [emailStatusMessage, setEmailStatusMessage] = useState('')

  const { register, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (e.target.name === 'email') {
      setEmailStatus('idle')
      setEmailStatusMessage('')
    }
  }

  const handleEmailBlur = async () => {
    const email = formData.email.trim()
    if (!email) return

    setEmailStatus('checking')
    try {
      const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`)
      const data = response.data.data
      if (data.available) {
        setEmailStatus('available')
        setEmailStatusMessage('This email is available.')
      } else {
        setEmailStatus('exists')
        setEmailStatusMessage(data.isEmailVerified ? 'This email is already registered.' : 'This account exists but is waiting for verification.')
      }
    } catch (error: any) {
      setEmailStatus('idle')
      setEmailStatusMessage(error.response?.data?.message || 'Email could not be checked')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    try {
      const payload = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role,
        requestTeacherRole: role === 'student' && requestTeacherRole,
      })
      toast.success('Account created. Please verify your email to sign in.')
      const query = new URLSearchParams({ email: formData.email.trim() })
      if (payload?.previewUrl) {
        query.set('previewUrl', payload.previewUrl)
      }
      navigate(`/verify-email?${query.toString()}`)
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.data?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`)
      }
    }
  }

  return (
    <div className="atlas-page flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="atlas-panel w-full max-w-lg p-8"
      >
        <p className="atlas-kicker">Join the atlas</p>
        <h1 className="text-3xl font-semibold text-ink mb-2">Create your account</h1>
        <p className="text-muted mb-6">Choose how you'll use LinguaNest. You can apply for mentor access as a student.</p>

        {(localError || error) && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
            {localError || error}
          </div>
        )}

        <div className="role-card-grid mb-6">
          <button type="button" onClick={() => setRole('student')} className={`role-card ${role === 'student' ? 'selected' : ''}`}>
            <FiBookOpen className="text-coral text-xl" />
            <strong>Student</strong>
            <span>Learn lessons, flashcards, and track your streak.</span>
          </button>
          <button type="button" onClick={() => { setRole('parent'); setRequestTeacherRole(false) }} className={`role-card ${role === 'parent' ? 'selected' : ''}`}>
            <FiUsers className="text-coral text-xl" />
            <strong>Parent</strong>
            <span>Follow a learner's progress and stay in touch.</span>
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input
                name="firstName"
                type="text"
                required
                className="input"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                name="lastName"
                type="text"
                required
                className="input"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              name="email"
              type="email"
              required
              className="input"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
            />
            {emailStatusMessage ? (
              <p className={`mt-2 text-sm ${emailStatus === 'available' ? 'text-emerald-600' : emailStatus === 'exists' ? 'text-amber-700' : 'text-slate-500'}`}>
                {emailStatus === 'checking' ? 'Checking email...' : emailStatusMessage}
              </p>
            ) : null}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              name="password"
              type="password"
              required
              className="input"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              required
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {role === 'student' && (
            <label className="flex items-start gap-3 p-3 rounded-lg bg-[#f6efe7] text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1"
                checked={requestTeacherRole}
                onChange={(e) => setRequestTeacherRole(e.target.checked)}
              />
              <span>I'd also like to apply to teach on LinguaNest. An admin will review this request after signup.</span>
            </label>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-coral font-semibold">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
