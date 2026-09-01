import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'
import { getNavSections, getAccountSection } from '../utils/navSections'
import Avatar from './ui/Avatar'

// Desktop-only now: always visible at lg+ via the sticky classes below. The mobile hamburger
// trigger and overlay-drawer behavior were removed in favor of BottomNav + the "More" screen,
// so this component no longer takes open/onClose props or renders a mobile close button.
export default function Sidebar() {
  const { user } = useAuthStore()
  const location = useLocation()
  const { t } = useI18n()

  const isActive = (path: string) => location.pathname.startsWith(path)

  const linkClasses = (path: string) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
      isActive(path)
        ? 'bg-[var(--accent-light)] font-semibold text-[var(--accent)]'
        : 'text-[var(--text-muted)] hover:bg-[var(--border-light)] hover:text-[var(--text-primary)]'
    }`

  const sections = getNavSections(user?.role, t)
  const accountSection = getAccountSection(t)

  return (
    <aside className="sticky top-0 z-0 hidden h-screen w-64 flex-shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] lg:block">
      <div className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2 pb-8">
          <img src="/linguanest-mark.svg" alt="" className="h-8 w-8" />
          <span className="font-display text-lg font-bold text-[var(--text-primary)]">LinguaNest</span>
        </div>

        <div className="flex-1 space-y-7">
          {[...sections, accountSection].map((section) => (
            <div key={section.label}>
              {section.label ? (
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                  {section.label}
                </p>
              ) : null}
              <nav className="space-y-1">
                {section.links.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link key={link.path} to={link.path} className={linkClasses(link.path)}>
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {user ? (
          <div className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-5">
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs capitalize text-[var(--text-muted)]">
                {user.billing?.plan && user.billing.plan !== 'none' ? user.billing.plan : t('sidebar.freePlan')}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
