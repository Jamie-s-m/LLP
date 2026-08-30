import express from 'express';
import { protect } from '../middleware/auth.js';
import { getHearts, refillHeartsWithCoins } from '../controllers/gamificationController.js';

const router = express.Router();

// Hearts (lesson/exercise lives)
router.get('/hearts', protect, getHearts);
router.post('/hearts/refill', protect, refillHeartsWithCoins);

export default router;
