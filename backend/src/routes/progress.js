import express from 'express';
import { enrollCourse, completeLesson, getMyLearning } from '../controllers/progressController.js';
import { protect } from require('../middleware/auth.js'); // Ensure path/method matches your auth middleware

const router = express.Router();

router.post('/enroll/:courseId', protect, enrollCourse);
router.post('/complete-lesson', protect, completeLesson);
router.get('/my-learning', protect, getMyLearning);

export default router;