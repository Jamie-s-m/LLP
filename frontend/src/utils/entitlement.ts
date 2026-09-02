// Client-side mirror of backend/src/utils/entitlement.js - display-only (a lock icon, a
// locked-state message). The server is the real authority: every gated endpoint enforces this
// independently, so a wrong or stale value here can only ever affect what the UI *shows*, never
// what a user can actually access.

interface BillingLike {
  status?: string | null
}

interface LessonLike {
  order?: number
  cefr?: string | null
}

const ENTITLED_STATUSES = new Set(['active', 'trialing'])

export const hasActivePlan = (billing?: BillingLike | null) => ENTITLED_STATUSES.has(billing?.status || '')

// Free tier: each course's A1-level content, plus Lesson 1 of every course regardless of level.
export const isLessonFree = (lesson: LessonLike) => lesson.order === 1 || lesson.cefr === 'A1'
