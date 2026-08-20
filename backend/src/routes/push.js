import express from 'express';
import { protect } from '../middleware/auth.js';
import PushSubscription from '../models/PushSubscription.js';

const router = express.Router();
router.use(protect);

router.post('/subscribe', async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid push subscription payload' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user.id, endpoint, keys },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true });
  } catch (error) { next(error); }
});

router.post('/unsubscribe', async (req, res, next) => {
  try {
    await PushSubscription.deleteOne({ endpoint: req.body.endpoint, user: req.user.id });
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
});

export default router;
