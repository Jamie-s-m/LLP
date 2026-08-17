import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
    },
    lesson: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lesson',
    },
    exercise: {
      type: mongoose.Schema.ObjectId,
      ref: 'Exercise',
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'in_progress',
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    score: Number, // out of 100
    attempts: {
      type: Number,
      default: 0,
    },
    timeSpent: Number, // in minutes
    startedAt: Date,
    completedAt: Date,
    answers: [
      {
        questionId: String,
        userAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        score: Number,
        feedback: String,
      },
    ],
    pointsEarned: {
      type: Number,
      default: 0,
    },
    mistakeNotes: [String],
  },
  { timestamps: true }
);

// Index for efficient querying
progressSchema.index({ student: 1, course: 1 });
progressSchema.index({ student: 1, lesson: 1 });

export default mongoose.model('Progress', progressSchema);
