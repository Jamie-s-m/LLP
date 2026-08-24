import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    contentKey: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    lesson: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: [
        'multiple_choice',
        'fill_blank',
        'matching',
        'speaking',
        'writing',
        'listening',
      ],
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    instructions: String,
    
    // For multiple choice
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed, // Can be index, string, or array
    
    // For fill in blank
    sentenceTemplate: String,
    correctAnswers: [String],
    
    // For matching
    leftItems: [String],
    rightItems: [String],
    correctPairs: [
      {
        left: Number,
        right: Number,
      },
    ],
    
    // For speaking
    audioReference: String,
    acceptablePronunciations: [String],
    
    // For writing
    maxWords: Number,
    minWords: Number,
    
    // For listening
    audioFile: String,
    transcript: String,
    
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    points: {
      type: Number,
      default: 10,
    },
    hints: [String],
    explanation: String,
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Exercise', exerciseSchema);
