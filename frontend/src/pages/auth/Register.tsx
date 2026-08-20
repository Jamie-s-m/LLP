import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBookOpen, FiUsers } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'

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

  const { register, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role,
        requestTeacherRole: role === 'student' && requestTeacherRole,
      })
      navigate(useAuthStore.getState().user?.role === 'parent' ? '/parent/dashboard' : '/dashboard')
    } catch (err: any) {
      // Handled in authStore
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
            />
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
