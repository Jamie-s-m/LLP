import express from 'express';
const router = express.Router();

// GET /api/progress
router.get('/', (req, res) => {
  res.json({ success: true, progress: {} });
});

// POST /api/progress/update
router.post('/update', (req, res) => {
  res.json({ success: true, message: 'Progress updated' });
});

export default router;