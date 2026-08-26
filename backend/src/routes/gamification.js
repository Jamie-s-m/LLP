import express from 'express';
import { protect } from '../middleware/auth.js';
import { awardXP, awardCoins } from '../controllers/gamificationController.js';

const router = express.Router();

// Award XP to current user
router.post('/award-xp', protect, awardXP);

// Award coins to current user
router.post('/award-coins', protect, awardCoins);

export default router;
