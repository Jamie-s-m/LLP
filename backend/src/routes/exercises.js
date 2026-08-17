import express from 'express';
const router = express.Router();

// GET /api/exercises
router.get('/', (req, res) => {
  res.json({ success: true, exercises: [] });
});

// POST /api/exercises/submit
router.post('/submit', (req, res) => {
  res.json({ success: true, message: 'Exercise submitted' });
});

export default router;