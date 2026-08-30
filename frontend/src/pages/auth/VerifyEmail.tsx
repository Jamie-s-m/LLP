import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiMail, FiRefreshCcw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useLanguageStore } from '../../store/languageStore'

const copy = {
  en: {
    created: 'Account created. Check your inbox for a verification link to finish creating your account.',
    defaultMessage: 'Check your inbox for a verification link to finish creating your account.',
    verifiedSuccess: 'Email verified successfully. You can now sign in.',
    verifyFailed: 'Verification link is invalid or expired.',
    resendSuccess: 'Verification email sent',
    resendMessage: 'We sent a fresh verification link. Please check your inbox and spam folder.',
    resendFailed: 'Unable to resend verification email',
    kicker: 'Email verification',
    title: 'Verify your account',
    smtp: 'SMTP is not configured in this environment yet. For development only, you can open the verification link directly:',
    verified: 'Email verified',
    continue: 'Continue to sign in',
    email: 'Email address',
    working: 'Working...',
    resend: 'Resend verification email',
    back: 'Back to sign in',
  },
  ru: {
    created: 'Аккаунт создан. Проверьте входящие, чтобы завершить создание аккаунта по ссылке подтверждения.',
    defaultMessage: 'Проверьте входящие, чтобы завершить создание аккаунта по ссылке подтверждения.',
    verifiedSuccess: 'Email успешно подтверждён. Теперь вы можете войти.',
    verifyFailed: 'Ссылка подтверждения недействительна или истекла.',
    resendSuccess: 'Письмо с подтверждением отправлено',
    resendMessage: 'Мы отправили новую ссылку подтверждения. Проверьте входящие и папку спама.',
    resendFailed: 'Не удалось отправить письмо повторно',
    kicker: 'Подтверждение email',
    title: 'Подтвердите аккаунт',
    smtp: 'SMTP пока не настроен в этой среде. Только для разработки вы можете открыть ссылку напрямую:',
    verified: 'Email подтверждён',
    continue: 'Продолжить вход',
    email: 'Email адрес',
    working: 'Обработка...',
    resend: 'Отправить письмо повторно',
    back: 'Вернуться ко входу',
  },
  uz: {
    created: 'Akkount yaratildi. Akkount yaratishni yakunlash uchun emaildagi tasdiq havolasini tekshiring.',
    defaultMessage: 'Akkount yaratishni yakunlash uchun emaildagi tasdiq havolasini tekshiring.',
    verifiedSuccess: 'Email muvaffaqiyatli tasdiqlandi. Endi kirishingiz mumkin.',
    verifyFailed: 'Tasdiqlash havolasi noto‘g‘ri yoki muddati tugagan.',
    resendSuccess: 'Tasdiqlash emaili yuborildi',
    resendMessage: 'Yangi tasdiqlash havolasini yubordik. Iltimos, inbox va spam papkasini tekshiring.',
    resendFailed: 'Tasdiqlash emailini qayta yuborib bo‘lmadi',
    kicker: 'Email tasdig‘i',
    title: 'Akkountingizni tasdiqlang',
    smtp: 'Bu muhitda SMTP hali sozlanmagan. Faqat development uchun havolani to‘g‘ridan-to‘g‘ri ochishingiz mumkin:',
    verified: 'Email tasdiqlandi',
    continue: 'Kirishga o‘tish',
    email: 'Email manzil',
    working: 'Ishlanmoqda...',
    resend: 'Tasdiqlash emailini qayta yuborish',
    back: 'Kirishga qaytish',
  },
} as const

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const initialEmail = searchParams.get('email') || ''
  const initialPreviewUrl = searchParams.get('previewUrl') || ''
  const registered = searchParams.get('registered') === '1'
  const language = useLanguageStore((state) => state.language)
  const ui = copy[language]
  const [email, setEmail] = useState(initialEmail)
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>(registered ? ui.created : ui.defaultMessage)
  const isTokenMode = useMemo(() => !!token, [token])
  const verifyRequestedFor = useRef<string | null>(null)

  useEffect(() => {
    if (!token || verifyRequestedFor.current === token) return
    verifyRequestedFor.current = token

    setStatus('loading')
    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((response) => {
        setStatus('success')
        setMessage(response.data.message || ui.verifiedSuccess)
      })
      .catch((error: any) => {
        setStatus('error')
        setMessage(error.response?.data?.message || ui.verifyFailed)
      })
  }, [token, ui.verifiedSuccess, ui.verifyFailed])

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setStatus('loading')
      const response = await api.post('/auth/resend-verification', { email })
      setPreviewUrl(response.data.data?.previewUrl || '')
      setStatus('idle')
      toast.success(response.data.message || ui.resendSuccess)
      setMessage(ui.resendMessage)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.response?.data?.message || ui.resendFailed)
    }
  }

  return (
    <div className="atlas-page auth-page flex items-center justify-center px-4 py-6">
      <div className="atlas-panel w-full max-w-xl p-6 sm:p-8">
        <p className="atlas-kicker">{ui.kicker}</p>
        <h1 className="mb-2 text-3xl font-semibold text-ink">{ui.title}</h1>
        <p className="mb-5 text-muted">{message}</p>

        {previewUrl && !isTokenMode ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {ui.smtp}{' '}
            <a href={previewUrl} className="break-all font-semibold underline">{previewUrl}</a>
          </div>
        ) : null}

        {status === 'success' ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-800">
            <div className="mb-3 flex items-center gap-3">
              <FiCheckCircle size={22} />
              <strong>{ui.verified}</strong>
            </div>
            <Link to={`/login?${new URLSearchParams({ email, verified: '1' }).toString()}`} className="btn btn-primary mt-2 inline-flex items-center gap-2">
              {ui.continue}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-4">
            <div>
            <label className="label">{ui.email}</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn btn-primary inline-flex items-center gap-2" disabled={status === 'loading'}>
                <FiRefreshCcw size={16} />
                {status === 'loading' ? ui.working : ui.resend}
              </button>
              <Link to="/login" className="btn btn-outline inline-flex items-center gap-2">
                <FiMail size={16} />
                {ui.back}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
