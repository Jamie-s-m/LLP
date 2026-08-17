import express from 'express';
const router = express.Router();

// GET /api/lessons
router.get('/', (req, res) => {
  res.json({ success: true, lessons: [] });
});

// GET /api/lessons/:id
router.get('/:id', (req, res) => {
  res.json({ success: true, lessonId: req.params.id });
});

export default router;