import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi'
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
        className="auth-card atlas-panel w-full max-w-md p-8 sm:p-10"
      >
        <div className="auth-icon dark:border-white dark:text-white" aria-hidden="true">
          <FiLock size={46} strokeWidth={1.5} />
        </div>
        <p className="atlas-kicker">{t('login.kicker')}</p>
        <h1 className="mb-2 text-center text-4xl font-semibold text-ink">{t('login.title')}</h1>
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
            <label className="label" htmlFor="login-email">{t('login.email')}</label>
            <input
              id="login-email"
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
            <label className="label" htmlFor="login-password">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
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
            className="btn auth-submit w-full"
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