import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

const copy = {
  en: {
    kicker: 'Account recovery',
    title: 'Create a new password',
    text: 'Choose a strong password with at least 8 characters.',
    missing: 'This reset link is incomplete or missing. Request a new password reset email to continue.',
    request: 'Request reset link',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    hint: 'Use at least 8 characters and avoid reusing old passwords.',
    saving: 'Saving...',
    reset: 'Reset password',
    back: 'Back to Sign In',
    mismatch: 'Passwords do not match',
    success: 'Password updated successfully',
    failed: 'Unable to reset password',
    show: 'Show password',
    hide: 'Hide password',
  },
  ru: {
    kicker: 'Восстановление аккаунта',
    title: 'Создайте новый пароль',
    text: 'Выберите надёжный пароль длиной не менее 8 символов.',
    missing: 'Эта ссылка для сброса неполная или отсутствует. Запросите новое письмо для сброса пароля.',
    request: 'Запросить ссылку',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите новый пароль',
    hint: 'Используйте не менее 8 символов и не повторяйте старые пароли.',
    saving: 'Сохранение...',
    reset: 'Сбросить пароль',
    back: 'Вернуться ко входу',
    mismatch: 'Пароли не совпадают',
    success: 'Пароль успешно обновлён',
    failed: 'Не удалось сбросить пароль',
    show: 'Показать пароль',
    hide: 'Скрыть пароль',
  },
  uz: {
    kicker: 'Akkountni tiklash',
    title: 'Yangi parol yarating',
    text: 'Kamida 8 belgidan iborat kuchli parol tanlang.',
    missing: 'Bu tiklash havolasi to‘liq emas yoki yo‘q. Davom etish uchun yangi tiklash xatini so‘rang.',
    request: 'Tiklash havolasini so‘rash',
    newPassword: 'Yangi parol',
    confirmPassword: 'Yangi parolni tasdiqlang',
    hint: 'Kamida 8 ta belgi ishlating va eski parollardan qayta foydalanmang.',
    saving: 'Saqlanmoqda...',
    reset: 'Parolni tiklash',
    back: 'Kirishga qaytish',
    mismatch: 'Parollar mos emas',
    success: 'Parol muvaffaqiyatli yangilandi',
    failed: 'Parolni tiklab bo‘lmadi',
    show: 'Parolni ko‘rsatish',
    hide: 'Parolni yashirish',
  },
} as const

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const email = useMemo(() => searchParams.get('email') || '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast.error(ui.mismatch)
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success(ui.success)
      const next = new URLSearchParams()
      if (email) next.set('email', email)
      next.set('reset', '1')
      navigate(`/login?${next.toString()}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || ui.failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="atlas-page auth-page flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="atlas-panel w-full max-w-md p-6 sm:p-8"
      >
        <p className="atlas-kicker">{ui.kicker}</p>
        <h1 className="mb-2 text-3xl font-semibold text-ink">{ui.title}</h1>
        <p className="mb-5 text-muted">{ui.text}</p>

        {!token ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {ui.missing}
            </div>
            <Link to="/forgot-password" className="btn btn-primary inline-block w-full text-center">{ui.request}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="label" htmlFor="reset-password-new">{ui.newPassword}</label>
              <div className="relative">
                <input id="reset-password-new" className="input pr-11" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] transition hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? ui.hide : ui.show}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="reset-password-confirm">{ui.confirmPassword}</label>
              <div className="relative">
                <input id="reset-password-confirm" className="input pr-11" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" required />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] transition hover:text-[var(--text-primary)]"
                  aria-label={showConfirmPassword ? ui.hide : ui.show}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <p className="text-sm text-muted">{ui.hint}</p>
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? ui.saving : ui.reset}</button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-muted">{ui.back}</Link>
        </div>
      </motion.div>
    </div>
  )
}
