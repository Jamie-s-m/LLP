import mongoose from 'mongoose';
import { SKILLS } from '../utils/skills.js';

const exerciseSchema = new mongoose.Schema(
  {
    // No schema-level default here on purpose: a `this.type`-dependent default function is
    // unreliable under findOneAndUpdate upsert (setDefaultsOnInsert.js does not guarantee `this`
    // is bound to the full document, and crashes for it - confirmed via a live seed run). Callers
    // (createExercise, seed.js) set this explicitly via utils/skills.js#inferSkillFromType, and
    // readers (submitExercise, getSkillsBreakdown) already fall back to the same inference for any
    // pre-existing exercise that predates this field.
    skill: {
      type: String,
      enum: SKILLS,
    },
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
