import mongoose from 'mongoose';

const flashcardProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    flashcard: {
      type: mongoose.Schema.ObjectId,
      ref: 'Flashcard',
      required: true,
    },
    deck: {
      type: String, // e.g., "Lesson-1-Vocabulary"
      required: true,
    },
    interval: {
      type: Number,
      default: 1, // Days until next review (Spaced Repetition)
    },
    easeFactor: {
      type: Number,
      default: 2.5, // SM-2 algorithm
    },
    repetitions: {
      type: Number,
      default: 0,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
    },
    lastReviewDate: Date,
    quality: Number, // 0-5 rating from SM-2 algorithm
    isNew: {
      type: Boolean,
      default: true,
    },
    isLearning: {
      type: Boolean,
      default: false,
    },
    isReview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

flashcardProgressSchema.index({ student: 1, nextReviewDate: 1 });
flashcardProgressSchema.index({ student: 1, deck: 1 });

export default mongoose.model('FlashcardProgress', flashcardProgressSchema);
