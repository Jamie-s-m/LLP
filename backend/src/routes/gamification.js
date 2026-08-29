import express from 'express';
import { protect } from '../middleware/auth.js';
import { awardXP, awardCoins, getHearts, refillHeartsWithCoins } from '../controllers/gamificationController.js';

const router = express.Router();

// Award XP to current user
router.post('/award-xp', protect, awardXP);

// Award coins to current user
router.post('/award-coins', protect, awardCoins);

// Hearts (lesson/exercise lives)
router.get('/hearts', protect, getHearts);
router.post('/hearts/refill', protect, refillHeartsWithCoins);

export default router;
