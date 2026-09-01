import mongoose from 'mongoose';

// A permanent, auditable log of one-time XP "grace credits" applied to correct for a fixed
// grading bug (see backend/scripts/migrations/mcGradingBug/). Deliberately NOT a silent
// User.xp mutation with no trace: every credit this system ever applies is recorded here first,
// which is both what makes re-running the migration safe (the unique index below rejects a
// duplicate credit for the same user+reason) and what makes it reversible (rollback.js reads
// these records back to know exactly how much to subtract, from whom).
const gradingRemediationSchema = new mongoose.Schema(
  {
    // Identifies which bug/migration this credit is for (e.g. 'mc-grading-bug-2026-09') -
    // scopes the uniqueness constraint so a future, unrelated remediation never collides with
    // this one.
    reason: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    xpCredited: { type: Number, required: true, min: 0 },
    affectedAttemptCount: { type: Number, required: true, min: 0 },
    // The affected-attempt window this credit was computed from - kept for audit purposes,
    // not re-derived from "now" on every read.
    cutoffDate: { type: Date, required: true },
    revertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

gradingRemediationSchema.index({ user: 1, reason: 1 }, { unique: true });

export default mongoose.model('GradingRemediation', gradingRemediationSchema);
