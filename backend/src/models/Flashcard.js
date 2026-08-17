import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema(
  {
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

export default mongoose.model('Flashcard', flashcardSchema);
