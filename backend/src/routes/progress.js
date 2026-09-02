import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { enrollCourse, completeLesson, getMyLearning, getStudentProgressForTeacher, getSkillsBreakdown, getSkillProfile, getTodayRecommendation, getClassAnalyticsForCourse } from '../controllers/progressController.js';

const router = express.Router();

router.post('/enroll/:courseId', protect, authorize('student'), enrollCourse);
router.post('/complete-lesson', protect, completeLesson);
router.get('/my-learning', protect, getMyLearning);
router.get('/skills-breakdown', protect, getSkillsBreakdown);
router.get('/skill-profile', protect, getSkillProfile);
router.get('/today', protect, getTodayRecommendation);
router.get('/student/:studentId', protect, authorize('teacher', 'admin'), getStudentProgressForTeacher);
router.get('/class-analytics/:courseId', protect, authorize('teacher', 'admin'), getClassAnalyticsForCourse);

export default router;