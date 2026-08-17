import express from 'express';
const router = express.Router();

// GET /api/forum/posts
router.get('/posts', (req, res) => {
  res.json({ success: true, posts: [] });
});

// POST /api/forum/posts
router.post('/posts', (req, res) => {
  res.json({ success: true, message: 'Post created' });
});

export default router;