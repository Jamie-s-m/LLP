import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group',
      required: true,
    },
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present',
    },
    markedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

// One attendance record per student per session (calendar day) per group - re-marking the
// same session must update that one record, not silently create a near-duplicate. This only
// holds if every write/query normalizes `date` to midnight UTC first (see
// normalizeSessionDate in attendanceController.js) - the index itself cannot catch two
// different Date values that represent the same calendar day.
attendanceSchema.index({ group: 1, student: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
