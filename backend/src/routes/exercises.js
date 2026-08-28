import express from 'express';
import { protect, authorizeRoleOrPermission } from '../middleware/auth.js';
import { getExercises, getExerciseById, createExercise, submitExercise } from '../controllers/exerciseController.js';

const router = express.Router();

router.get('/', protect, getExercises);
router.get('/:id', protect, getExerciseById);
router.post('/', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), createExercise);
router.post('/submit', protect, submitExercise);

export default router;