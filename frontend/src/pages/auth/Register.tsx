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
    kicker: 'Join Auralex',
    title: 'Create your account',
    copy: 'Choose how you\'ll use Auralex. You can apply for mentor access as a student.',
    familyIntent: 'Family account setup selected.',
    teacherIntent: 'Teaching workspace interest selected. Your teaching request will go to admin review after signup.',
    student: 'Student',
    studentCopy: 'Learn lessons, flashcards, and track your streak.',
    parent: 'Parent',
    parentCopy: 'Follow a learner\'s progress and stay in touch.',
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
    passwordHint: 'Use at least 8 characters.',
    confirmPassword: 'Confirm Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    teacherInterest: 'I\'d also like to apply to teach on Auralex. An admin will review this request after signup.',
    creating: 'Creating Account...',
    create: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign In',
    passwordMismatch: 'Passwords do not match',
    emailInUse: 'This email is already in use. Sign in instead, or continue to email verification if the account is still pending.',
    createSuccess: 'Account created. Please verify your email to sign in.',
  },
  ru: {
    kicker: 'Присоединяйтесь к Auralex',
    title: 'Создайте аккаунт',
    copy: 'Выберите, как вы будете использовать Auralex. Как студент вы можете подать заявку на доступ преподавателя.',
    familyIntent: 'Выбрана настройка семейного аккаунта.',
    teacherIntent: 'Выбран интерес к пространству преподавателя. После регистрации заявка попадёт на проверку администратору.',
    student: 'Студент',
    studentCopy: 'Изучайте уроки, карточки и отслеживайте серию.',
    parent: 'Родитель',
    parentCopy: 'Следите за прогрессом ученика и оставайтесь на связи.',
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
    passwordHint: 'Используйте не менее 8 символов.',
    confirmPassword: 'Подтвердите пароль',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    teacherInterest: 'Я также хочу подать заявку на преподавание в Auralex. Администратор проверит запрос после регистрации.',
    creating: 'Создание аккаунта...',
    create: 'Создать аккаунт',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    signIn: 'Войти',
    passwordMismatch: 'Пароли не совпадают',
    emailInUse: 'Этот email уже используется. Войдите или перейдите к подтверждению email, если аккаунт ещё не активирован.',
    createSuccess: 'Аккаунт создан. Подтвердите email, чтобы войти.',
  },
  uz: {
    kicker: 'Auralex’ga qo‘shiling',
    title: 'Akkount yarating',
    copy: 'Auralex’dan qanday foydalanishingizni tanlang. Talaba sifatida ustozlik uchun ariza berishingiz mumkin.',
    familyIntent: 'Oilaviy akkount sozlamasi tanlandi.',
    teacherIntent: 'Ustoz ish maydoniga qiziqish tanlandi. Ro‘yxatdan o‘tgach so‘rovingiz admin ko‘rib chiqishiga yuboriladi.',
    student: 'Talaba',
    studentCopy: 'Darslar, kartochkalar va seriyangizni kuzating.',
    parent: 'Ota-ona',
    parentCopy: 'O‘quvchi progressini kuzating va aloqada bo‘ling.',
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
    passwordHint: 'Kamida 8 ta belgi ishlating.',
    confirmPassword: 'Parolni tasdiqlang',
    showPassword: 'Parolni ko‘rsatish',
    hidePassword: 'Parolni yashirish',
    teacherInterest: 'Men Auralex’da dars berish uchun ham ariza bermoqchiman. Admin bu so‘rovni ro‘yxatdan o‘tgandan keyin ko‘rib chiqadi.',
    creating: 'Akkount yaratilmoqda...',
    create: 'Akkount yaratish',
    alreadyHaveAccount: 'Akkountingiz bormi?',
    signIn: 'Kirish',
    passwordMismatch: 'Parollar mos emas',
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
    confirmPassword: '',
  })
  const [role, setRole] = useState<SignupRole>(searchParams.get('role') === 'parent' ? 'parent' : 'student')
  const [requestTeacherRole, setRequestTeacherRole] = useState(searchParams.get('teacherInterest') === '1')
  const [localError, setLocalError] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle')
  const [emailStatusMessage, setEmailStatusMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

    if (formData.password !== formData.confirmPassword) {
      setLocalError(ui.passwordMismatch)
      return
    }

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
    <div className="atlas-page flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="atlas-panel w-full max-w-lg p-8"
      >
        <p className="atlas-kicker">{ui.kicker}</p>
        <h1 className="text-3xl font-semibold text-ink mb-2">{ui.title}</h1>
        <p className="text-muted mb-6">{ui.copy}</p>
        {planIntent ? (
          <div className="mb-6 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200">
            {planIntent}
          </div>
        ) : null}

        {(localError || error) && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
            {localError || error}
          </div>
        )}

        <div className="role-card-grid mb-6">
          <button type="button" onClick={() => setRole('student')} className={`role-card ${role === 'student' ? 'selected' : ''}`}>
            <FiBookOpen className="text-coral text-xl" />
            <strong>{ui.student}</strong>
            <span>{ui.studentCopy}</span>
          </button>
          <button type="button" onClick={() => { setRole('parent'); setRequestTeacherRole(false) }} className={`role-card ${role === 'parent' ? 'selected' : ''}`}>
            <FiUsers className="text-coral text-xl" />
            <strong>{ui.parent}</strong>
            <span>{ui.parentCopy}</span>
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
                <Link to="/login" className="text-coral font-semibold">{ui.signInInstead}</Link>
                <Link to={`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`} className="text-primary-600 font-semibold dark:text-primary-300">
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
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{ui.passwordHint}</p>
          </div>

          <div>
            <label className="label">{ui.confirmPassword}</label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="input pr-11"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-200"
                aria-label={showConfirmPassword ? ui.hidePassword : ui.showPassword}
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {role === 'student' && (
            <label className="flex items-start gap-3 p-3 rounded-lg bg-[#f6efe7] text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1"
                checked={requestTeacherRole}
                onChange={(e) => setRequestTeacherRole(e.target.checked)}
              />
              <span>{ui.teacherInterest}</span>
            </label>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? ui.creating : ui.create}
          </button>
        </form>

        <p className="text-center text-muted mt-6">
          {ui.alreadyHaveAccount}{' '}
          <Link to="/login" className="text-coral font-semibold">
            {ui.signIn}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
