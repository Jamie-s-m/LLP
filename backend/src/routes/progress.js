import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { enrollCourse, completeLesson, getMyLearning, getStudentProgressForTeacher } from '../controllers/progressController.js';

const router = express.Router();

router.post('/enroll/:courseId', protect, enrollCourse);
router.post('/complete-lesson', protect, completeLesson);
router.get('/my-learning', protect, getMyLearning);
router.get('/student/:studentId', protect, authorize('teacher', 'admin'), getStudentProgressForTeacher);

export default router;