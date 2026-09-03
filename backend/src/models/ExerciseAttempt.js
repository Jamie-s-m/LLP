import mongoose from 'mongoose';
import { SKILLS } from '../utils/skills.js';

const exerciseAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    exercise: { type: mongoose.Schema.ObjectId, ref: 'Exercise', required: true },
    // Denormalized at attempt time so historical analytics stay stable even if the
    // exercise's own skill tag is edited later.
    skill: { type: String, enum: SKILLS, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, default: 0 },
    // Speaking attempts are submitted for a teacher to grade rather than auto-graded, so they
    // start 'pending_review' with a provisional isCorrect:false that skills-breakdown excludes
    // (see progressController.getSkillsBreakdown) until a teacher reviews them.
    status: { type: String, enum: ['graded', 'pending_review'], default: 'graded' },
    audioSubmission: { type: String, default: '' },
    // Writing attempts, same review model as speaking (see submitExercise) - free text instead
    // of an audio recording.
    writtenSubmission: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    reviewFeedback: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

exerciseAttemptSchema.index({ user: 1, createdAt: -1 });
exerciseAttemptSchema.index({ user: 1, skill: 1 });
exerciseAttemptSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ExerciseAttempt', exerciseAttemptSchema);
