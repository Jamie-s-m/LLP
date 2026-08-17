import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    image: String,
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
    },
    language: {
      type: String,
      enum: ['English', 'Turkish', 'Russian', 'Uzbek'],
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    maxMembers: Number,
    isPrivate: {
      type: Boolean,
      default: false,
    },
    joinRequests: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    moderators: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    topics: [String], // Tags or topics discussed
    studyGoals: [String],
    meetingSchedule: String,
    timezone: String,
  },
  { timestamps: true }
);

export default mongoose.model('Group', groupSchema);
