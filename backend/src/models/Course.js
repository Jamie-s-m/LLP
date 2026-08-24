import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    contentKey: {
      type: String,
      required: false,
      trim: true,
      index: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a course title'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Please provide a course description'],
    },
    language: {
      type: String,
      required: true,
      enum: ['English', 'Turkish', 'Russian', 'Uzbek'],
    },
    level: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    thumbnail: String,
    instructor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Grammar',
        'Vocabulary',
        'Conversation',
        'Reading',
        'Writing',
        'Listening',
      ],
      required: true,
    },
    lessons: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Lesson',
      },
    ],
    students: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    totalLessons: {
      type: Number,
      default: 0,
    },
    estimatedHours: Number,
    prerequisites: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
