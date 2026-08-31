import express from 'express';
import { trackEvent } from '../controllers/analyticsController.js';

const router = express.Router();

// Public - fires from both anonymous (pre-signup) and authenticated pages.
router.post('/track', trackEvent);

export default router;
