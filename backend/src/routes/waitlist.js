import express from 'express';
import { joinWaitlist, getWaitlistCount } from '../controllers/waitlistController.js';
import { protect, authorize } from '../middleware/auth.js';
import WaitlistEntry from '../models/WaitlistEntry.js';

const router = express.Router();

// Public - anyone can join a waitlist, signed in or not.
router.post('/join', joinWaitlist);
router.get('/count', getWaitlistCount);

// Admin-only - the whole point of a real waitlist is that the founder can actually follow
// up with the people on it (see the previous startup audit's kill/pivot recommendation).
router.get(
  '/entries',
  protect,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { feature } = req.query;
      const filter = feature ? { feature } : {};
      const entries = await WaitlistEntry.find(filter).sort({ createdAt: -1 }).limit(1000);
      res.status(200).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
