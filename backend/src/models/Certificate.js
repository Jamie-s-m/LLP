import mongoose from 'mongoose';
import crypto from 'crypto';

// PRIORITY 20: technical foundation for "LinguaNest Certificate of Achievement" - never
// "Cambridge certified" or "official CEFR certification" anywhere this is rendered (see
// backend/src/data/certificateMethodology.js for the exact wording used).
const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      // Non-guessable: 16 random bytes as hex, not an incrementing id or the user's own
      // Mongo _id, so a public verification URL can't be enumerated to discover other
      // learners' certificates.
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    achievementType: {
      type: String,
      enum: ['course_completion', 'level_readiness'],
      required: true,
    },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true },
    cefrLevel: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], required: true },
    // Snapshotted at issuance so a later mastery-threshold or curriculum change can't silently
    // rewrite what an already-issued certificate claims (PRIORITY 172: don't retroactively
    // apply an educational-change to historical achievements).
    evidenceSnapshot: {
      masteryPercentage: Number,
      lessonsEvaluated: Number,
      lessonsProficient: Number,
    },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    revokedReason: { type: String, default: '' },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

certificateSchema.index({ user: 1, course: 1, achievementType: 1, cefrLevel: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
