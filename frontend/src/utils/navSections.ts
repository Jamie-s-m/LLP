import {
  FiBook,
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
import type { IconType } from 'react-icons'

export type NavLink = { label: string; path: string; icon: IconType }
export type NavSection = { label?: string; links: NavLink[] }
export type AppRole = 'student' | 'teacher' | 'parent' | 'moderator' | 'admin' | undefined

// Single source of truth for every destination a signed-in user can reach, grouped by role.
// Sidebar (desktop, always visible) and the mobile bottom-nav + "More" screen both render
// from this so the two surfaces never drift out of sync with each other.
export const getNavSections = (role: AppRole, t: (key: string) => string): NavSection[] => {
  if (role === 'teacher' || role === 'admin') {
    const teacherLinks: NavLink[] = [
      { label: t('sidebar.dashboard'), path: '/teacher/dashboard', icon: FiGrid },
      { label: t('sidebar.createCourse'), path: '/teacher/create-course', icon: FiEdit3 },
      { label: t('sidebar.myCourses'), path: '/teacher/courses', icon: FiBook },
      { label: t('sidebar.speakingReviews'), path: '/teacher/speaking-reviews', icon: FiMic },
      { label: t('sidebar.schedule'), path: '/timetable', icon: FiCalendar },
      { label: t('sidebar.chat'), path: '/chat', icon: FiMessageCircle },
    ]
    return [
      { label: t('sidebar.sectionTeach'), links: teacherLinks },
      ...(role === 'admin'
        ? [{ label: t('sidebar.sectionAdmin'), links: [{ label: t('sidebar.controlCenter'), path: '/admin/control-center', icon: FiGrid }] }]
        : []),
    ]
  }

  if (role === 'parent') {
    return [
      {
        label: t('sidebar.sectionFamily'),
        links: [
          { label: t('sidebar.familyDesk'), path: '/parent/dashboard', icon: FiGrid },
          { label: t('sidebar.schedule'), path: '/timetable', icon: FiCalendar },
          { label: t('sidebar.chat'), path: '/chat', icon: FiMessageCircle },
        ],
      },
    ]
  }

  if (role === 'moderator') {
    return [
      { label: t('sidebar.sectionAdmin'), links: [{ label: t('sidebar.moderationDesk'), path: '/admin/control-center', icon: FiGrid }] },
    ]
  }

  // student (and the default/fallback shape)
  return [
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

export const getAccountSection = (t: (key: string) => string): NavSection => ({
  label: t('sidebar.sectionAccount'),
  links: [{ label: t('sidebar.settings'), path: '/profile', icon: FiSettings }],
})

// The 4 (or fewer) destinations shown as direct bottom-nav tabs, per role - everything else
// in getNavSections/getAccountSection surfaces on the "More" screen instead. Kept deliberately
// short of 5 so a "More" tab always fits without crowding a phone-width nav bar.
export const getPrimaryMobilePaths = (role: AppRole): string[] => {
  if (role === 'teacher' || role === 'admin') {
    return role === 'admin'
      ? ['/admin/control-center', '/teacher/courses', '/chat']
      : ['/teacher/dashboard', '/teacher/courses', '/chat']
  }
  if (role === 'parent') return ['/parent/dashboard', '/chat']
  if (role === 'moderator') return ['/admin/control-center', '/chat']
  return ['/dashboard', '/my-learning', '/flashcards', '/chat']
}
