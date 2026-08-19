import express from 'express';
import { protect } from '../middleware/auth.js';
import { getLessons, getLessonById, createLesson } from '../controllers/lessonController.js';

const router = express.Router();

router.get('/', protect, getLessons);
router.get('/:id', protect, getLessonById);
router.post('/', protect, createLesson);

export default router;