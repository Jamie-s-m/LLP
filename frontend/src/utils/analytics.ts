import api from '../services/api'

// Must match backend/src/models/AnalyticsEvent.js's PUBLIC_ANALYTICS_EVENTS exactly - the
// server rejects anything else. Deliberately excludes payment_completed/subscription_cancelled/
// payment_refunded: those can only be asserted by a verified Payme/Click webhook, never by
// this client, and the backend enforces that separately (INTERNAL_ANALYTICS_EVENTS) - they
// aren't in this union so no frontend call site can even attempt to send one.
export type AnalyticsEvent =
  | 'signup_started' | 'signup_completed'
  | 'onboarding_started' | 'onboarding_completed'
  | 'placement_started' | 'placement_completed'
  | 'lesson_started' | 'lesson_completed' | 'exercise_completed' | 'flashcard_reviewed'
  | 'daily_goal_completed' | 'streak_maintained'
  | 'pricing_viewed' | 'checkout_started'
  | 'referral_started' | 'referral_completed'

const ANON_ID_KEY = 'ln_anon_id'

const getAnonymousId = (): string => {
  try {
    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(ANON_ID_KEY, id)
    }
    return id
  } catch {
    return 'anon-unknown'
  }
}

// Fire-and-forget by design: a tracking failure must never surface to the user or block the
// action they're actually taking. Never await this at a call site.
export const track = (event: AnalyticsEvent, metadata?: Record<string, string | number | boolean>): void => {
  api
    .post('/analytics/track', {
      event,
      anonymousId: getAnonymousId(),
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      metadata,
    })
    .catch(() => undefined)
}
