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
  },
  { timestamps: true }
);

exerciseAttemptSchema.index({ user: 1, createdAt: -1 });
exerciseAttemptSchema.index({ user: 1, skill: 1 });

export default mongoose.model('ExerciseAttempt', exerciseAttemptSchema);
