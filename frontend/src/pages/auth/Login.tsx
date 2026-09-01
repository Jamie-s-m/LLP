import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuthStore, api } from '../../store/authStore'
import toast from 'react-hot-toast'
import { useI18n } from '../../utils/i18n'
import { useEffect } from 'react'
import { Alert } from '../../components/ui'

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  not_configured: 'Google sign-in is coming soon — use email for now.',
  denied: 'Google sign-in was cancelled or the request expired. Please try again.',
  no_email: 'Your Google account has no email address we can use.',
  disabled: 'This account has been disabled. Please contact support.',
  server_error: 'Something went wrong signing in with Google. Please try again.',
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
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

  useEffect(() => {
    const googleError = searchParams.get('googleError')
    if (googleError) {
      toast.error(GOOGLE_ERROR_MESSAGES[googleError] || GOOGLE_ERROR_MESSAGES.server_error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError('')
    const normalizedEmail = email.trim().toLowerCase()

    try {
      await login(normalizedEmail, password)
      toast.success(t('login.loginSuccess'))
      const loggedInUser = useAuthStore.getState().user
      const destination = loggedInUser?.role === 'admin'
        ? '/admin/control-center'
        : loggedInUser?.role === 'parent'
          ? '/parent/dashboard'
          : loggedInUser?.role === 'teacher'
            ? '/teacher/dashboard'
            : loggedInUser?.role === 'student' && !loggedInUser?.onboardingCompletedAt
              ? '/onboarding'
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
      // A toast alone is easy to miss (auto-dismisses, can appear off-screen on some
      // layouts) - keep it for the ambient signal, but also leave a message in the form
      // itself so a user who misses the toast can still see what went wrong.
      setLoginError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="atlas-page auth-page flex items-center justify-center px-4 py-4 sm:py-6">
      <div className="auth-shell w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(17,24,39,0.08)] dark:border-[var(--dark-border)] dark:bg-[var(--dark-surface)]">
        <div className="auth-left hidden w-[42%] flex-col justify-between p-10 lg:flex">
          <div className="auth-left-top">
            <div className="auth-logo mb-16 flex items-center gap-3 text-white">
              <div className="auth-logo-icon">
                <img src="/linguanest-mark.svg" alt="" />
              </div>
              <span className="font-['Bricolage_Grotesque',sans-serif] text-[22px] font-bold tracking-[-0.02em]">LinguaNest</span>
            </div>
            <p className="auth-quote max-w-[360px] font-['Bricolage_Grotesque',sans-serif] text-[32px] font-bold leading-[1.25] tracking-[-0.02em] text-white">
              Learn <span>naturally</span> and speak with confidence.
            </p>
          </div>

          <div className="auth-testimonial rounded-[1.5rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
            <div className="testimonial-stars mb-4 text-[var(--dark-accent)] tracking-[2px]" aria-hidden="true">★★★★★</div>
            <p className="testimonial-text text-[15px] leading-6 text-white/80">
              “The flow feels calm and motivating — I can practice daily without pressure, and my speaking confidence is finally growing.”
            </p>
            <div className="testimonial-author flex items-center gap-3">
              <div className="testimonial-avatar">AM</div>
              <div>
                <div className="testimonial-name text-sm font-bold text-white">Amina M.</div>
                <div className="testimonial-role text-xs text-white/50">Advanced learner</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right flex flex-1 items-center justify-center p-5 sm:p-6 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="auth-card w-full max-w-md rounded-[2rem] bg-[var(--surface)] p-5 sm:p-6 dark:bg-[var(--dark-surface)]"
          >
            <p className="atlas-kicker">{t('login.kicker')}</p>
            <h1 className="mb-1 text-center text-2xl font-semibold text-[var(--text-primary)] dark:text-white">{t('login.title')}</h1>
            <p className="text-muted mb-4 text-[var(--text-muted)] dark:text-[var(--dark-text-secondary)]">
              {t('login.copy')}
            </p>
            {notice ? (
              <Alert variant="success" className="mb-4">{notice}</Alert>
            ) : null}
            {loginError ? (
              <Alert variant="error" className="mb-4">{loginError}</Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label" htmlFor="login-email">{t('login.email')}</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError('') }}
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
                    onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[var(--border-light)] hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
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

            <div className="my-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              {t('login.orContinueWith')}
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <a
              href={`${api.defaults.baseURL}/auth/google`}
              className="btn btn-outline w-full gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9C16.98 14.2 17.64 11.9 17.64 9.2z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
              </svg>
              {t('login.continueWithGoogle')}
            </a>

            <div className="mt-3 text-center space-y-1.5">
              <Link
                to="/forgot-password"
                className="block text-sm font-medium text-[var(--accent)]"
              >
                {t('login.forgotPassword')}
              </Link>
              <p className="text-[var(--text-muted)] dark:text-[var(--dark-text-secondary)]">
                {t('login.noAccount')}{' '}
                <Link to="/register" className="font-semibold text-[var(--accent)]">
                  {t('login.signUp')}
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}