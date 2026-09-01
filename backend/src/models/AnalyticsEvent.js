import mongoose from 'mongoose';

// The canonical, allowed event names for the minimum production analytics layer. Kept as a
// fixed list (validated in the controller, not just documented here) so this collection
// answers "where do users stop" cleanly instead of accumulating whatever string a future
// call site happens to pass.
//
// Split in two, deliberately: PUBLIC_ANALYTICS_EVENTS is the only list the unauthenticated
// POST /api/analytics/track controller validates against. INTERNAL_ANALYTICS_EVENTS names
// events whose truth can only come from a trusted server-side source (a verified Stripe/Payme
// webhook) - a client claiming "I just paid" or "I just cancelled" is not evidence of
// anything, and a founder dashboard built on that claim is forgeable by a single anonymous
// HTTP request. recordBillingEvent() (billingController.js) writes these directly via
// AnalyticsEvent.create(), never through the public controller, so they still need to be
// valid according to the Mongoose schema - just not postable by a client. ANALYTICS_EVENTS
// (the schema-level enum) is the union of both; only PUBLIC_ANALYTICS_EVENTS is client-facing.
export const PUBLIC_ANALYTICS_EVENTS = [
  // Acquisition
  'signup_started', 'signup_completed',
  // Onboarding
  'onboarding_started', 'onboarding_completed',
  // Placement
  'placement_started', 'placement_completed',
  // Learning
  'lesson_started', 'lesson_completed', 'exercise_completed', 'flashcard_reviewed',
  // Engagement
  'daily_goal_completed', 'streak_maintained',
  // Monetization (viewing/starting checkout is a real client action - completing or
  // cancelling a paid subscription is not something a client can honestly assert)
  'pricing_viewed', 'checkout_started',
  // Referral (event names reserved for when a referral feature exists - not wired up yet)
  'referral_started', 'referral_completed',
];

export const INTERNAL_ANALYTICS_EVENTS = [
  'payment_completed', 'subscription_cancelled', 'payment_refunded',
];

export const ANALYTICS_EVENTS = [...PUBLIC_ANALYTICS_EVENTS, ...INTERNAL_ANALYTICS_EVENTS];

const analyticsEventSchema = new mongoose.Schema(
  {
    event: { type: String, enum: ANALYTICS_EVENTS, required: true, index: true },
    // Nullable: acquisition-stage events (signup_started, pricing_viewed on a public page)
    // fire before a user exists. Set once available so later queries can still bucket a
    // pre-signup event with the account it eventually led to, without any automatic merge.
    user: { type: mongoose.Schema.ObjectId, ref: 'User', default: null, index: true },
    anonymousId: { type: String, default: null },
    path: { type: String, default: '' },
    // Small, non-sensitive context only (plan key, course id, score) - never email,
    // password, tokens, or free text a user typed.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analyticsEventSchema.index({ event: 1, createdAt: -1 });
analyticsEventSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
