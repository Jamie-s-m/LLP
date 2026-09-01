import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
    contentKey: {
      type: String,
      trim: true,
    },
    lesson: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lesson',
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
    },
    language: {
      type: String,
      required: true,
      enum: ['English', 'Turkish', 'Russian', 'Uzbek'],
    },
    front: {
      text: {
        type: String,
        required: true,
      },
      audio: String,
      image: String,
    },
    back: {
      text: {
        type: String,
        required: true,
      },
      audio: String,
      image: String,
    },
    category: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    tags: [String],
    exampleSentences: [
      {
        original: String,
        translation: String,
      },
    ],
  },
  { timestamps: true }
);

// See Course.js's identical index for why this is a partial index rather than
// `unique + sparse`.
flashcardSchema.index(
  { contentKey: 1 },
  { unique: true, partialFilterExpression: { contentKey: { $type: 'string' } } }
);

export default mongoose.model('Flashcard', flashcardSchema);
