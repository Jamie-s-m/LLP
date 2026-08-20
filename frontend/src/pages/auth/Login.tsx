import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { useI18n } from '../../utils/i18n'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { t } = useI18n()
  const notice = searchParams.get('verified') === '1'
    ? t('login.verified')
    : searchParams.get('reset') === '1'
      ? t('login.reset')
      : searchParams.get('registered') === '1'
        ? t('login.registered')
        : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      await login(normalizedEmail, password)
      toast.success(t('login.loginSuccess'))
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
        t('login.loginFailed')
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
        <p className="atlas-kicker">{t('login.kicker')}</p>
        <h1 className="text-3xl font-semibold text-ink mb-2">{t('login.title')}</h1>
        <p className="text-muted mb-8">
          {t('login.copy')}
        </p>
        {notice ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">{t('login.email')}</label>
            <input
              type="email"
              className="input"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="label">{t('login.password')}</label>
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
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
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
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            to="/forgot-password"
            className="block text-sm text-coral font-medium"
          >
            {t('login.forgotPassword')}
          </Link>
          <p className="text-muted">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-coral font-semibold">
              {t('login.signUp')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}