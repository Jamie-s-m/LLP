import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    badge: {
      type: mongoose.Schema.ObjectId,
      ref: 'Badge',
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userAchievementSchema.index({ student: 1 });
userAchievementSchema.index({ student: 1, badge: 1 }, { unique: true });

export default mongoose.model('UserAchievement', userAchievementSchema);
