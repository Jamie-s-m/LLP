import express from 'express';
import { protect } from '../middleware/auth.js';
import { getExercises, createExercise, submitExercise } from '../controllers/exerciseController.js';

const router = express.Router();

router.get('/', protect, getExercises);
router.post('/', protect, createExercise);
router.post('/submit', protect, submitExercise);

export default router;