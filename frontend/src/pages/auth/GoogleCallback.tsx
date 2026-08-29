import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, useAuthStore } from '../../store/authStore'
import { useI18n } from '../../utils/i18n'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const { t } = useI18n()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const token = searchParams.get('token')
    if (!token) {
      toast.error(t('login.loginFailed'))
      navigate('/login', { replace: true })
      return
    }

    setToken(token)

    api
      .get('/users/profile')
      .then((response) => {
        const user = response.data.data || response.data.user || response.data
        setUser(user)
        toast.success(t('login.loginSuccess'))
        const role = user?.role
        const destination = role === 'admin'
          ? '/admin/control-center'
          : role === 'parent'
            ? '/parent/dashboard'
            : role === 'teacher'
              ? '/teacher/dashboard'
              : '/dashboard'
        navigate(destination, { replace: true })
      })
      .catch(() => {
        setToken(null)
        toast.error(t('login.loginFailed'))
        navigate('/login', { replace: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="atlas-page flex items-center justify-center px-4 py-16">
      <div className="atlas-panel p-6 text-center text-[var(--text-muted)]">{t('login.signingIn')}</div>
    </div>
  )
}
