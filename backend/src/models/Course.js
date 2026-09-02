import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    contentKey: {
      type: String,
      required: false,
      trim: true,
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
    // Course.level (Beginner/Intermediate/Advanced) predates CEFR tagging and is still the
    // field catalog/filter UI reads. `cefr` is a lighter, display-only companion for
    // single-level courses - null for pathways that span multiple CEFR levels (e.g. the
    // reference course, A1->A2->B1 under one Course), where Lesson.cefr per-lesson is the
    // real source of truth masteryEngine.js reads. Mirrors Lesson.js's cefr field exactly.
    cefr: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', null], default: null },
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

// A plain single-field `unique: true, sparse: true` index would work for documents that
// never set contentKey at all, but not for any future accidental `contentKey: null` (sparse
// only excludes a genuinely *missing* field, not an explicit null) - see the compound-index
// comment on Lesson/Exercise for the fuller version of this gotcha. A partial index sidesteps
// it entirely and keeps all four content models consistent.
courseSchema.index(
  { contentKey: 1 },
  { unique: true, partialFilterExpression: { contentKey: { $type: 'string' } } }
);

export default mongoose.model('Course', courseSchema);
