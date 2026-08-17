import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    icon: String,
    color: String,
    requirement: {
      type: String, // Description of how to earn this badge
      required: true,
    },
    category: {
      type: String,
      enum: ['milestone', 'streak', 'achievement', 'special'],
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Badge', badgeSchema);
