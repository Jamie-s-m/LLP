import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

const copy = {
  en: {
    kicker: 'Account recovery',
    title: 'Forgot password',
    text: 'Enter your email address and we\'ll send you a link to reset your password.',
    sent: 'Reset link sent to your email!',
    success: 'If an account exists for {email}, a password reset link has been dispatched.',
    smtp: 'This link is only shown in local development, since it grants control of the account. In production, check your inbox for the real reset email instead.',
    back: 'Back to Sign In',
    send: 'Send Reset Link',
    sending: 'Sending link...',
    failed: 'Failed to send reset link',
  },
  ru: {
    kicker: 'Восстановление аккаунта',
    title: 'Забыли пароль',
    text: 'Введите email адрес, и мы отправим ссылку для сброса пароля.',
    sent: 'Ссылка для сброса отправлена на ваш email!',
    success: 'Если аккаунт для {email} существует, ссылка для сброса была отправлена.',
    smtp: 'Эта ссылка показывается только в локальной разработке, так как даёт доступ к аккаунту. В продакшене проверьте письмо со сбросом пароля во входящих.',
    back: 'Вернуться ко входу',
    send: 'Отправить ссылку',
    sending: 'Отправка...',
    failed: 'Не удалось отправить ссылку для сброса',
  },
  uz: {
    kicker: 'Akkountni tiklash',
    title: 'Parolni unutdingizmi',
    text: 'Email manzilingizni kiriting, biz sizga parolni qayta tiklash havolasini yuboramiz.',
    sent: 'Tiklash havolasi emailingizga yuborildi!',
    success: '{email} uchun akkount mavjud bo‘lsa, parolni tiklash havolasi yuborildi.',
    smtp: 'Bu havola faqat lokal development muhitida ko‘rsatiladi, chunki u akkountni boshqarish huquqini beradi. Production’da pochta qutingizdagi haqiqiy tiklash xatini tekshiring.',
    back: 'Kirishga qaytish',
    send: 'Tiklash havolasini yuborish',
    sending: 'Yuborilmoqda...',
    failed: 'Tiklash havolasini yuborib bo‘lmadi',
  },
} as const

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const response = await api.post('/auth/forgot-password', { email: normalizedEmail })
      toast.success(ui.sent)
      setPreviewUrl(response.data.data?.previewUrl || '')
      setSubmitted(true)
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        ui.failed
      toast.error(message)
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
        className="atlas-panel w-full max-w-md p-6 sm:p-8 text-center"
      >
        <p className="atlas-kicker">{ui.kicker}</p>
        <h1 className="text-3xl font-semibold text-ink mb-2">{ui.title}</h1>
        <p className="text-muted mb-5">{ui.text}</p>

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
              {ui.success.replace('{email}', email)}
            </div>
            {previewUrl ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
                {ui.smtp}{' '}
                <a href={previewUrl} className="break-all font-semibold underline">{previewUrl}</a>
              </div>
            ) : null}
            <Link to="/login" className="btn btn-primary w-full inline-block">
              {ui.back}
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
              {loading ? ui.sending : ui.send}
            </button>
          </form>
        )}

        <div className="mt-6">
          <Link
            to="/login"
            className="text-sm text-muted"
          >
            ← {ui.back}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}