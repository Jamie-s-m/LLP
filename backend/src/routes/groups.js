import express from 'express';
const router = express.Router();

// GET /api/groups
router.get('/', (req, res) => {
  res.json({ success: true, groups: [] });
});

// POST /api/groups
router.post('/', (req, res) => {
  res.json({ success: true, message: 'Group created' });
});

export default router;