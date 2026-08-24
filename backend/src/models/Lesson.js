import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    contentKey: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a lesson title'],
      trim: true,
    },
    description: String,
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Lesson must have content'],
    },
    contentType: {
      type: String,
      enum: ['text', 'video', 'audio', 'interactive'],
      default: 'text',
    },
    mediaUrl: String,
    duration: Number, // in minutes
    vocabulary: [
      {
        word: String,
        translation: String,
        pronunciation: String,
        examples: [String],
      },
    ],
    grammar: [
      {
        rule: String,
        explanation: String,
        examples: [String],
      },
    ],
    exercises: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Exercise',
      },
    ],
    completionTime: Number, // estimated in minutes
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Lesson', lessonSchema);
