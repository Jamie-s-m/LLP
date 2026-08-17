import express from 'express';
const router = express.Router();

// GET /api/flashcards
router.get('/', (req, res) => {
  res.json({ success: true, flashcards: [] });
});

// POST /api/flashcards
router.post('/', (req, res) => {
  res.json({ success: true, message: 'Flashcard created' });
});

export default router;