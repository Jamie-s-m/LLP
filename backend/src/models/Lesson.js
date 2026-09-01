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
    // Explicit, measurable "the learner can..." outcomes for this lesson - see
    // backend/src/data/curriculumBlueprint.js for the level-wide goals these should trace
    // back to. Optional so existing/generated lessons that predate this field don't break;
    // the reference curriculum (backend/src/data/referenceCurriculum.js) sets it on every lesson.
    cefr: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', null], default: null },
    objectives: [
      {
        description: { type: String, required: true },
        skill: { type: String, enum: ['grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing'], required: true },
      },
    ],
  },
  { timestamps: true }
);

// seed.js upserts on this exact compound key (course + contentKey); enforce it at the
// database layer too, not just via application-level findOneAndUpdate filters, so a
// concurrent or repeated seed run can never create duplicate lessons for the same course.
// A plain `sparse: true` compound index is NOT enough here: Mongo's sparse rule for compound
// indexes only requires ONE of the fields to be present, and `course` always is - so two
// lessons in the same course that both simply never set contentKey (every hand-created
// lesson in tests/the admin UI) would collide on the same "missing" index entry. A partial
// index scoped to real string contentKeys applies the constraint only to seed-managed
// lessons, exactly the set it's meant to protect.
lessonSchema.index(
  { course: 1, contentKey: 1 },
  { unique: true, partialFilterExpression: { contentKey: { $type: 'string' } } }
);

export default mongoose.model('Lesson', lessonSchema);
