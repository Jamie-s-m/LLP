import express from 'express';
const router = express.Router();

// GET /api/courses
router.get('/', (req, res) => {
  res.json({ success: true, courses: [] });
});

// GET /api/courses/:id
router.get('/:id', (req, res) => {
  res.json({ success: true, courseId: req.params.id });
});

export default router;