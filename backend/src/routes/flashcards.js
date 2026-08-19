import express from 'express';
import { protect } from '../middleware/auth.js';
import { getFlashcards, createFlashcard, reviewFlashcard } from '../controllers/flashcardController.js';

const router = express.Router();

router.get('/', protect, getFlashcards);
router.post('/', protect, createFlashcard);
router.get('/:id/review', protect, reviewFlashcard);

export default router;