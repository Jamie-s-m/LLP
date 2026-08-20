import express from 'express';
import { protect } from '../middleware/auth.js';
import { getLessons, getLessonById, createLesson, updateLesson, deleteLesson } from '../controllers/lessonController.js';

const router = express.Router();

router.get('/', protect, getLessons);
router.get('/:id', protect, getLessonById);
router.post('/', protect, createLesson);
router.put('/:id', protect, updateLesson);
router.delete('/:id', protect, deleteLesson);

export default router;