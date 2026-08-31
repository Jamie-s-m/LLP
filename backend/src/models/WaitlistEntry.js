import mongoose from 'mongoose';

// Captures real demand for features that don't exist yet (starting with speaking
// practice / human tutoring, which replaced a hardcoded fake tutor marketplace) instead
// of shipping fabricated content. One entry per (email, feature) pair - the same person
// can join more than one waitlist, but joining twice for the same feature is a no-op.
const waitlistEntrySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true, default: '' },
    feature: {
      type: String,
      enum: ['speaking_practice'],
      required: true,
      default: 'speaking_practice',
    },
    locale: { type: String, default: 'en' },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

waitlistEntrySchema.index({ email: 1, feature: 1 }, { unique: true });

export default mongoose.model('WaitlistEntry', waitlistEntrySchema);
