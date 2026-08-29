import express from 'express';
import { protect, authorizeRoleOrPermission } from '../middleware/auth.js';
import { getFlashcards, createFlashcard, reviewFlashcard } from '../controllers/flashcardController.js';

const router = express.Router();

router.get('/', protect, getFlashcards);
router.post('/', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), createFlashcard);
router.post('/:id/review', protect, reviewFlashcard);

export default router;