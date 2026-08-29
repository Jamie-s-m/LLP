import { Link, useLocation } from 'react-router-dom'
import {
  FiBook,
  FiChevronLeft,
  FiUsers,
  FiMessageSquare,
  FiAward,
  FiSettings,
  FiGrid,
  FiEdit3,
  FiTrendingUp,
  FiMessageCircle,
  FiCalendar,
  FiBarChart2,
  FiTarget,
  FiMic,
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'
import { useI18n } from '../utils/i18n'
import Avatar from './ui/Avatar'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

type NavLink = { label: string; path: string; icon: typeof FiGrid }
type NavSection = { label?: string; links: NavLink[] }

export default function Sidebar({ open, onClose }: SidebarProps) {
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

  let sections: NavSection[]

  if (user?.role === 'teacher' || user?.role === 'admin') {
    const teacherLinks: NavLink[] = [
      { label: t('sidebar.dashboard'), path: '/teacher/dashboard', icon: FiGrid },
      { label: t('sidebar.createCourse'), path: '/teacher/create-course', icon: FiEdit3 },
      { label: t('sidebar.myCourses'), path: '/teacher/courses', icon: FiBook },
      { label: t('sidebar.speakingReviews'), path: '/teacher/speaking-reviews', icon: FiMic },
    ]
    sections = [
      { label: t('sidebar.sectionTeach'), links: teacherLinks },
      ...(user.role === 'admin'
        ? [{ label: t('sidebar.sectionAdmin'), links: [{ label: t('sidebar.controlCenter'), path: '/admin/control-center', icon: FiGrid }] }]
        : []),
    ]
  } else if (user?.role === 'parent') {
    sections = [
      {
        label: t('sidebar.sectionFamily'),
        links: [
          { label: t('sidebar.familyDesk'), path: '/parent/dashboard', icon: FiGrid },
          { label: t('sidebar.chat'), path: '/chat', icon: FiMessageCircle },
        ],
      },
    ]
  } else if (user?.role === 'moderator') {
    sections = [
      { label: t('sidebar.sectionAdmin'), links: [{ label: t('sidebar.moderationDesk'), path: '/admin/control-center', icon: FiGrid }] },
    ]
  } else {
    sections = [
      {
        label: t('sidebar.sectionLearn'),
        links: [
          { label: t('sidebar.dashboard'), path: '/dashboard', icon: FiGrid },
          { label: t('sidebar.placementTest'), path: '/placement-test', icon: FiTarget },
          { label: t('sidebar.myLearning'), path: '/my-learning', icon: FiBook },
          { label: t('sidebar.flashcards'), path: '/flashcards', icon: FiAward },
          { label: t('sidebar.progress'), path: '/progress', icon: FiBarChart2 },
          { label: t('sidebar.schedule'), path: '/timetable', icon: FiCalendar },
        ],
      },
      {
        label: t('sidebar.sectionCommunity'),
        links: [
          { label: t('sidebar.groups'), path: '/groups', icon: FiUsers },
          { label: t('sidebar.leaderboard'), path: '/leaderboard', icon: FiTrendingUp },
          { label: t('sidebar.achievements'), path: '/achievements', icon: FiAward },
          { label: t('sidebar.forum'), path: '/forum', icon: FiMessageSquare },
          { label: t('sidebar.chat'), path: '/chat', icon: FiMessageCircle },
        ],
      },
    ]
  }

  const accountSection: NavSection = {
    label: t('sidebar.sectionAccount'),
    links: [{ label: t('sidebar.settings'), path: '/profile', icon: FiSettings }],
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[150] w-[min(20rem,90vw)] flex-shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(15,23,42,0.28)] transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col p-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <img src="/linguanest-mark.svg" alt="" className="h-8 w-8 rounded-[10px]" />
            <span className="font-display text-lg font-bold text-[var(--text-primary)]">LinguaNest</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition hover:bg-[var(--border-light)]"
            aria-label={t('sidebar.closeMenu')}
          >
            <FiChevronLeft size={20} />
          </button>
        </div>

        <div className="hidden items-center gap-2 pb-8 lg:flex">
          <img src="/linguanest-mark.svg" alt="" className="h-9 w-9 rounded-[10px]" />
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
                    <Link key={link.path} to={link.path} className={linkClasses(link.path)} onClick={() => onClose()}>
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
