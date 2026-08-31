import mongoose from 'mongoose';

// The canonical, allowed event names for the minimum production analytics layer. Kept as a
// fixed list (validated in the controller, not just documented here) so this collection
// answers "where do users stop" cleanly instead of accumulating whatever string a future
// call site happens to pass.
export const ANALYTICS_EVENTS = [
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
  // Monetization
  'pricing_viewed', 'checkout_started', 'payment_completed', 'subscription_cancelled',
  // Referral (event names reserved for when a referral feature exists - not wired up yet)
  'referral_started', 'referral_completed',
];

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
