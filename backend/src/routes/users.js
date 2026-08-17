import express from 'express';
const router = express.Router();

router.get('/profile', (req, res) => {
  res.json({ success: true, message: 'Get user profile' });
});

export default router;