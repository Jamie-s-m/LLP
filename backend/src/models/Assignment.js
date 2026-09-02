import mongoose from 'mongoose';

// lesson-XOR-exercise and students-or-group are business rules validated in
// assignmentController.createAssignment, not here - keeps error messages clean and matches
// this repo's existing style of doing that kind of validation in the controller (see
// courseController/progressController).
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
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
    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    group: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group',
    },
    dueDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);
