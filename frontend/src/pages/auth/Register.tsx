import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiBookOpen, FiEye, FiEyeOff, FiUsers } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import { useLanguageStore } from '../../store/languageStore'
import api from '../../services/api'
import toast from 'react-hot-toast'

type SignupRole = 'student' | 'parent'

const registerCopy = {
  en: {
    title: 'Create your account',
    copy: 'Choose how you\'ll use LinguaNest.',
    familyIntent: 'Family account setup selected.',
    teacherIntent: 'Teaching workspace interest selected. Your teaching request will go to admin review after signup.',
    student: 'Student',
    parent: 'Parent',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    checking: 'Checking email...',
    available: 'This email is available.',
    registered: 'This email is already registered.',
    pending: 'This account exists but is waiting for verification.',
    emailCheckFailed: 'Email could not be checked',
    signInInstead: 'Sign in instead',
    continueVerification: 'Continue to verification',
    password: 'Password',
    passwordHint: 'At least 8 characters',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    teacherInterest: 'I\'d also like to apply to teach on LinguaNest. An admin will review this request after signup.',
    teacherInterestToggle: 'Want to teach on LinguaNest instead?',
    creating: 'Creating Account...',
    create: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign In',
    orContinueWith: 'Or continue with',
    continueWithGoogle: 'Continue with Google',
    emailInUse: 'This email is already in use. Sign in instead, or continue to email verification if the account is still pending.',
    createSuccess: 'Account created. Please verify your email to sign in.',
  },
  ru: {
    title: 'Создайте аккаунт',
    copy: 'Выберите, как вы будете использовать LinguaNest.',
    familyIntent: 'Выбрана настройка семейного аккаунта.',
    teacherIntent: 'Выбран интерес к пространству преподавателя. После регистрации заявка попадёт на проверку администратору.',
    student: 'Студент',
    parent: 'Родитель',
    firstName: 'Имя',
    lastName: 'Фамилия',
    email: 'Email',
    checking: 'Проверяем email...',
    available: 'Этот email доступен.',
    registered: 'Этот email уже зарегистрирован.',
    pending: 'Этот аккаунт существует, но ждёт подтверждения.',
    emailCheckFailed: 'Не удалось проверить email',
    signInInstead: 'Войти вместо этого',
    continueVerification: 'Перейти к подтверждению',
    password: 'Пароль',
    passwordHint: 'Не менее 8 символов',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    teacherInterest: 'Я также хочу подать заявку на преподавание в LinguaNest. Администратор проверит запрос после регистрации.',
    teacherInterestToggle: 'Хотите преподавать на LinguaNest?',
    creating: 'Создание аккаунта...',
    create: 'Создать аккаунт',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    signIn: 'Войти',
    orContinueWith: 'Или продолжите с',
    continueWithGoogle: 'Продолжить с Google',
    emailInUse: 'Этот email уже используется. Войдите или перейдите к подтверждению email, если аккаунт ещё не активирован.',
    createSuccess: 'Аккаунт создан. Подтвердите email, чтобы войти.',
  },
  uz: {
    title: 'Akkount yarating',
    copy: 'LinguaNest’dan qanday foydalanishingizni tanlang.',
    familyIntent: 'Oilaviy akkount sozlamasi tanlandi.',
    teacherIntent: 'Ustoz ish maydoniga qiziqish tanlandi. Ro‘yxatdan o‘tgach so‘rovingiz admin ko‘rib chiqishiga yuboriladi.',
    student: 'Talaba',
    parent: 'Ota-ona',
    firstName: 'Ism',
    lastName: 'Familiya',
    email: 'Email manzil',
    checking: 'Email tekshirilmoqda...',
    available: 'Bu email bo‘sh.',
    registered: 'Bu email allaqachon ro‘yxatdan o‘tgan.',
    pending: 'Bu akkount mavjud, lekin tasdiq kutilmoqda.',
    emailCheckFailed: 'Emailni tekshirib bo‘lmadi',
    signInInstead: 'Buning o‘rniga kirish',
    continueVerification: 'Tasdiqqa o‘tish',
    password: 'Parol',
    passwordHint: 'Kamida 8 ta belgi',
    showPassword: 'Parolni ko‘rsatish',
    hidePassword: 'Parolni yashirish',
    teacherInterest: 'Men LinguaNest’da dars berish uchun ham ariza bermoqchiman. Admin bu so‘rovni ro‘yxatdan o‘tgandan keyin ko‘rib chiqadi.',
    teacherInterestToggle: 'LinguaNest’da dars bermoqchimisiz?',
    creating: 'Akkount yaratilmoqda...',
    create: 'Akkount yaratish',
    alreadyHaveAccount: 'Akkountingiz bormi?',
    signIn: 'Kirish',
    orContinueWith: 'Yoki davom eting',
    continueWithGoogle: 'Google bilan davom etish',
    emailInUse: 'Bu email allaqachon ishlatilgan. Tizimga kiring yoki akkount hali kutilayotgan bo‘lsa email tasdig‘iga o‘ting.',
    createSuccess: 'Akkount yaratildi. Kirish uchun emailingizni tasdiqlang.',
  },
} as const

export default function Register() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [role, setRole] = useState<SignupRole>(searchParams.get('role') === 'parent' ? 'parent' : 'student')
  const [requestTeacherRole, setRequestTeacherRole] = useState(searchParams.get('teacherInterest') === '1')
  const [showTeacherOption, setShowTeacherOption] = useState(searchParams.get('teacherInterest') === '1')
  const [localError, setLocalError] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle')
  const [emailStatusMessage, setEmailStatusMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const language = useLanguageStore((state) => state.language)
  const ui = registerCopy[language]

  const { register, isLoading, error } = useAuthStore()
  const navigate = useNavigate()
  const planIntent = role === 'parent'
    ? ui.familyIntent
    : requestTeacherRole
      ? ui.teacherIntent
      : ''

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
        setEmailStatusMessage(ui.available)
      } else {
        setEmailStatus('exists')
        setEmailStatusMessage(data.isEmailVerified ? ui.registered : ui.pending)
      }
    } catch (error: any) {
      setEmailStatus('idle')
      setEmailStatusMessage(error.response?.data?.message || ui.emailCheckFailed)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    const normalizedEmail = formData.email.trim().toLowerCase()

    if (emailStatus === 'exists') {
      setLocalError(ui.emailInUse)
      return
    }

    try {
      const payload = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: normalizedEmail,
        password: formData.password,
        role,
        requestTeacherRole: role === 'student' && requestTeacherRole,
      })
      toast.success(ui.createSuccess)
      const query = new URLSearchParams({ email: formData.email.trim() })
      query.set('registered', '1')
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
    <div className="atlas-page auth-page flex items-center justify-center px-4 py-3 sm:py-4">
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
              Grow in <span>language</span> and belong anywhere.
            </p>
          </div>

          <div className="auth-testimonial rounded-[1.5rem] border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
            <div className="testimonial-stars mb-4 text-[#fbbf24] tracking-[2px]">★★★★★</div>
            <p className="testimonial-text text-[15px] leading-6 text-white/80">
              “A thoughtful learning space for families, students, and teachers — the entire experience feels well designed and human.”
            </p>
            <div className="testimonial-author flex items-center gap-3">
              <div className="testimonial-avatar">SD</div>
              <div>
                <div className="testimonial-name text-sm font-bold text-white">Sardor D.</div>
                <div className="testimonial-role text-xs text-white/50">Parent & learner</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right flex flex-1 items-center justify-center p-4 sm:p-5 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="auth-card w-full max-w-lg rounded-[2rem] bg-[var(--surface)] p-4 sm:p-5 dark:bg-[var(--dark-surface)]"
          >
            <h1 className="mb-0.5 text-2xl font-semibold text-[var(--text-primary)] dark:text-white">{ui.title}</h1>
            <p className="text-muted mb-2 text-[var(--text-muted)] dark:text-[var(--dark-text-secondary)]">{ui.copy}</p>
            {planIntent ? (
              <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--accent-light)] px-4 py-3 text-sm text-[var(--accent)] dark:border-[var(--dark-border)] dark:bg-white/5 dark:text-[var(--dark-text-secondary)]">
                {planIntent}
              </div>
            ) : null}

            {(localError || error) && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {localError || error}
              </div>
            )}

            <div className="role-card-grid mb-1.5">
              <button type="button" onClick={() => setRole('student')} className={`role-card ${role === 'student' ? 'selected' : ''}`}>
                <FiBookOpen className="text-[var(--accent)] text-base" />
                <strong>{ui.student}</strong>
              </button>
              <button type="button" onClick={() => { setRole('parent'); setRequestTeacherRole(false) }} className={`role-card ${role === 'parent' ? 'selected' : ''}`}>
                <FiUsers className="text-[var(--accent)] text-base" />
                <strong>{ui.parent}</strong>
              </button>
            </div>

            <form className="space-y-2.5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{ui.firstName}</label>
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
                  <label className="label">{ui.lastName}</label>
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
                <label className="label">{ui.email}</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="input"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  autoComplete="email"
                />
                {emailStatusMessage ? (
                  <p className={`mt-2 text-sm ${emailStatus === 'available' ? 'text-emerald-600' : emailStatus === 'exists' ? 'text-amber-700' : 'text-slate-500'}`}>
                    {emailStatus === 'checking' ? ui.checking : emailStatusMessage}
                  </p>
                ) : null}
                {emailStatus === 'exists' ? (
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <Link to="/login" className="font-semibold text-[var(--accent)]">{ui.signInInstead}</Link>
                    <Link to={`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`} className="font-semibold text-[var(--accent)]">
                      {ui.continueVerification}
                    </Link>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="label">{ui.password}</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="input pr-11"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder={ui.passwordHint}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={showPassword ? ui.hidePassword : ui.showPassword}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {role === 'student' && (
                showTeacherOption ? (
                  <label className="flex items-start gap-3 rounded-lg bg-[var(--surface-strong)] p-2.5 text-sm text-[var(--text-muted)] dark:bg-white/5 dark:text-[var(--dark-text-secondary)]">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={requestTeacherRole}
                      onChange={(e) => setRequestTeacherRole(e.target.checked)}
                    />
                    <span>{ui.teacherInterest}</span>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTeacherOption(true)}
                    className="text-sm font-semibold text-[var(--accent)]"
                  >
                    {ui.teacherInterestToggle}
                  </button>
                )
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? ui.creating : ui.create}
              </button>
            </form>

            <div className="my-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              {ui.orContinueWith}
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <a href={`${api.defaults.baseURL}/auth/google`} className="btn btn-outline w-full gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9C16.98 14.2 17.64 11.9 17.64 9.2z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
              </svg>
              {ui.continueWithGoogle}
            </a>

            <p className="mt-1.5 text-center text-[var(--text-muted)] dark:text-[var(--dark-text-secondary)]">
              {ui.alreadyHaveAccount}{' '}
              <Link to="/login" className="font-semibold text-[var(--accent)]">
                {ui.signIn}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
