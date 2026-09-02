import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  markAttendance,
  getAttendanceForGroup,
  getAttendanceSummaryForStudent,
} from '../controllers/attendanceController.js';

const router = express.Router();

// Ownership (group-manager) checks happen INSIDE the controllers, since they need the
// loaded Group document (and, for the summary route, to also allow the student themselves).
router.post('/:groupId', protect, markAttendance);
router.get('/:groupId', protect, getAttendanceForGroup);
router.get('/:groupId/summary/:studentId', protect, getAttendanceSummaryForStudent);

export default router;
