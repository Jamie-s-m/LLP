import { Link, useNavigate } from 'react-router-dom'
import { FiChevronRight, FiLogOut } from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useI18n } from '../utils/i18n'
import { getNavSections, getAccountSection, getPrimaryMobilePaths } from '../utils/navSections'
import Avatar from '../components/ui/Avatar'

const copy = {
  en: { title: 'More', logout: 'Log out' },
  ru: { title: 'Ещё', logout: 'Выйти' },
  uz: { title: 'Yana', logout: 'Chiqish' },
} as const

export default function MoreMenu() {
  const { user, logout } = useAuthStore()
  const totalUnread = useChatStore((state) => state.totalUnread)
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const ui = copy[language]

  const primaryPaths = new Set(getPrimaryMobilePaths(user?.role))
  const sections = [...getNavSections(user?.role, t), getAccountSection(t)]
    .map((section) => ({ ...section, links: section.links.filter((link) => !primaryPaths.has(link.path)) }))
    .filter((section) => section.links.length > 0)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-6 pb-28">
      <h1 className="mb-5 text-2xl font-bold text-[var(--text-primary)]">{ui.title}</h1>

      {user ? (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user.firstName} {user.lastName}</p>
            <p className="truncate text-xs capitalize text-[var(--text-muted)]">{user.email}</p>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            {section.label ? (
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{section.label}</p>
            ) : null}
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              {section.links.map((link, index) => {
                const Icon = link.icon
                const badge = link.path === '/chat' ? totalUnread : 0
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex min-h-[56px] items-center gap-3 px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] transition active:bg-[var(--border-light)] ${index > 0 ? 'border-t border-[var(--border)]' : ''}`}
                  >
                    <Icon size={19} className="shrink-0 text-[var(--text-muted)]" />
                    <span className="flex-1">{link.label}</span>
                    {badge > 0 ? (
                      <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">{badge > 99 ? '99+' : badge}</span>
                    ) : null}
                    <FiChevronRight size={18} className="shrink-0 text-[var(--text-subtle)]" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-[var(--error)]/30 bg-[var(--error-light)] px-4 py-3 text-[15px] font-semibold text-[var(--error)] transition active:opacity-80"
        >
          <FiLogOut size={19} className="shrink-0" />
          {ui.logout}
        </button>
      </div>
    </div>
  )
}
