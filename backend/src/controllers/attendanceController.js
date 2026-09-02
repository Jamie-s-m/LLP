import Group from '../models/Group.js';
import Attendance from '../models/Attendance.js';
import { isOwnerId } from '../middleware/auth.js';

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'];

// Mirrors groupController.js's isGroupManager EXACTLY - group.creator may be populated (a
// document) or a raw ObjectId depending on the query, so the comparison must go through
// isOwnerId rather than a hand-rolled .toString() === .toString(), which silently never
// matches once creator is populated (see the isOwnerId doc comment in middleware/auth.js).
const isGroupManager = (group, userId) => {
  const id = userId.toString();
  return isOwnerId(group.creator, userId) || group.moderators.some((mod) => mod.toString() === id);
};

// `date` represents a whole session, not a precise timestamp - normalize to midnight UTC
// everywhere it is written or queried so that re-marking the same calendar day's session
// always resolves to the same record instead of creating a near-duplicate the unique index
// ({ group, student, date }) won't catch.
const normalizeSessionDate = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

export const markAttendance = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (req.user.role !== 'admin' && !isGroupManager(group, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the group teacher or a moderator can mark attendance' });
    }

    const { date, records } = req.body;
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'date and a non-empty records array are required' });
    }

    const sessionDate = normalizeSessionDate(date);
    if (Number.isNaN(sessionDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const memberIds = new Set(group.members.map((member) => member.toString()));

    const marked = [];
    const skipped = [];

    for (const record of records) {
      const { studentId, status, notes } = record || {};

      if (!studentId || !memberIds.has(studentId.toString())) {
        skipped.push({ studentId, reason: 'not a member of this group' });
        continue;
      }

      if (status !== undefined && !ATTENDANCE_STATUSES.includes(status)) {
        skipped.push({ studentId, reason: 'invalid status' });
        continue;
      }

      const update = {
        markedBy: req.user.id,
      };
      if (status !== undefined) update.status = status;
      if (notes !== undefined) update.notes = notes;

      const attendance = await Attendance.findOneAndUpdate(
        { group: group._id, student: studentId, date: sessionDate },
        { $set: update, $setOnInsert: { group: group._id, student: studentId, date: sessionDate } },
        { upsert: true, new: true, runValidators: true }
      );

      marked.push(attendance);
    }

    res.status(200).json({ success: true, data: { marked, skipped } });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceForGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (req.user.role !== 'admin' && !isGroupManager(group, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Only the group teacher or a moderator can view attendance' });
    }

    const filter = { group: group._id };
    const { from, to } = req.query;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = normalizeSessionDate(from);
      if (to) filter.date.$lte = normalizeSessionDate(to);
    }

    const records = await Attendance.find(filter)
      .populate('student', 'firstName lastName email')
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceSummaryForStudent = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const { studentId } = req.params;
    const isSelf = req.user.id.toString() === studentId.toString();
    if (req.user.role !== 'admin' && !isSelf && !isGroupManager(group, req.user.id)) {
      return res.status(403).json({ success: false, message: 'You cannot view this student\'s attendance summary' });
    }

    const records = await Attendance.find({ group: group._id, student: studentId });

    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    records.forEach((record) => {
      if (counts[record.status] !== undefined) counts[record.status] += 1;
    });

    const totalSessions = records.length;
    const attendanceRate = totalSessions > 0 ? Math.round((counts.present / totalSessions) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        groupId: group._id,
        studentId,
        totalSessions,
        counts,
        attendanceRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
