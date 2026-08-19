import express from 'express';
import { enrollCourse, completeLesson, getMyLearning } from '../controllers/progressController.js';
import { protect } = require('../middleware/auth.js'); // <-- REMOVE THIS LINE
import { protect } from '../middleware/auth.js';      // <-- USE THIS INSTEAD

const router = express.Router();

router.post('/enroll/:courseId', protect, enrollCourse);
router.post('/complete-lesson', protect, completeLesson);
router.get('/my-learning', protect, getMyLearning);

export default router;