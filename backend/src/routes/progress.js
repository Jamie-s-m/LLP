import express from 'express';
import { enrollCourse, completeLesson, getMyLearning } from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js'; // Must be 'from', not '='

const router = express.Router();

router.post('/enroll/:courseId', protect, enrollCourse);
router.post('/complete-lesson', protect, completeLesson);
router.get('/my-learning', protect, getMyLearning);

export default router;