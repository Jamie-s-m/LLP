import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: function requiresPassword() { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['student', 'teacher', 'parent', 'moderator', 'admin'], default: 'student' },
    moderatorPermissions: {
      communityModeration: { type: Boolean, default: false },
      supportChat: { type: Boolean, default: false },
      catalogContentQa: { type: Boolean, default: false },
      limitedUserManagement: { type: Boolean, default: false },
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: '' },
    emailVerificationExpiresAt: { type: Date, default: null },
    emailVerificationSentAt: { type: Date, default: null },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpiresAt: { type: Date, default: null },
    passwordResetSentAt: { type: Date, default: null },
    avatar: { type: String, default: '' },
    nativeLanguage: { type: String, default: 'English' },
    targetLanguages: [{ type: String }],
    placementLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', null], default: null },
    // The raw CEFR tier (finer-grained than placementLevel's 3-tier bucket), plus the
    // per-skill breakdown from that same placement attempt - persisted so a skill profile can
    // be shown later without needing the original submission still in memory. See
    // progressController.getSkillProfile.
    placementCefr: { type: String, enum: ['A1', 'A2', 'B1', 'B2', null], default: null },
    placementSkillStats: {
      grammar: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      vocabulary: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      reading: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
    },
    placementCompletedAt: { type: Date, default: null },
    // Captured during the 3-step onboarding flow (goal, self-assessed level, daily time
    // commitment) that runs before the placement test on a new student's first visit.
    learningGoal: {
      type: String,
      enum: ['job', 'it', 'abroad', 'study', 'confidence', 'other', null],
      default: null,
    },
    selfAssessedLevel: {
      type: String,
      enum: ['beginner', 'basic', 'intermediate', 'advanced', 'not_sure', null],
      default: null,
    },
    dailyGoalMinutes: { type: Number, enum: [10, 15, 30, 60, null], default: null },
    onboardingCompletedAt: { type: Date, default: null },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    // Hearts (lesson/exercise lives) system
    hearts: { type: Number, default: 5 },
    maxHearts: { type: Number, default: 5 },
    heartsRegenAt: { type: Date, default: null },
    // Daily Reward & Gamification fields
    lastDailyRewardDate: { type: Date, default: null },
    dailyRewardStreak: { type: Number, default: 0 },
    linguaCoins: { type: Number, default: 0 },
    totalLinguaCoinsEarned: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teacherApplicationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    billing: {
      plan: { type: String, enum: ['none', 'local', 'learner', 'family', 'teaching'], default: 'none' },
      status: {
        type: String,
        enum: ['inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'refunded'],
        default: 'inactive',
      },
      provider: { type: String, enum: ['none', 'stripe', 'payme'], default: 'none' },
      stripeCustomerId: { type: String, default: '' },
      stripeSubscriptionId: { type: String, default: '' },
      stripePriceId: { type: String, default: '' },
      lastStripeEventId: { type: String, default: '' },
      // Stripe's own event.created (when the event happened, not when it was delivered) - used
      // to reject an out-of-order webhook delivery (e.g. a subscription.updated that happened
      // BEFORE a later subscription.deleted, but arrives AFTER it) from silently reverting
      // billing state. See handleStripeWebhook.
      lastStripeEventCreatedAt: { type: Date, default: null },
      paymeTransactionId: { type: String, default: '' },
      currentPeriodEnd: { type: Date, default: null },
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpiresAt = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

userSchema.methods.verifyPasswordResetToken = function (token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return this.passwordResetToken === hashedToken && this.passwordResetExpiresAt > Date.now();
};

export default mongoose.model('User', userSchema);