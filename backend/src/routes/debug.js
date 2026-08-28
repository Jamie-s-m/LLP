import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { runSeed, seedStatus } from '../controllers/debugController.js';

const router = express.Router();

// GET /api/debug/seed-status
router.get('/seed-status', seedStatus);

// POST /api/debug/seed-demo  (requires DEMO_SEED_TOKEN in production via x-demo-seed-token header)
router.post('/seed-demo', protect, authorize('admin'), runSeed);

export default router;
