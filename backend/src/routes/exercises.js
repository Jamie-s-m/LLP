import express from 'express';
import { protect, authorizeRoleOrPermission } from '../middleware/auth.js';
import {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  submitExercise,
  listSpeakingReviews,
  reviewSpeakingAttempt,
} from '../controllers/exerciseController.js';

const router = express.Router();

const manageAuth = authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] });

router.get('/reviews/speaking', protect, manageAuth, listSpeakingReviews);
router.post('/reviews/speaking/:attemptId', protect, manageAuth, reviewSpeakingAttempt);

router.get('/', protect, getExercises);
router.get('/:id', protect, getExerciseById);
router.post('/', protect, manageAuth, createExercise);
router.put('/:id', protect, manageAuth, updateExercise);
router.delete('/:id', protect, manageAuth, deleteExercise);
router.post('/submit', protect, submitExercise);

export default router;
