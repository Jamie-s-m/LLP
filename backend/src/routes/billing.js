import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getBillingPlansController,
  getMyBillingState,
  handlePaymeRequest,
  handleClickRequest,
} from '../controllers/billingController.js';

const router = express.Router();

// Public webhook endpoints for Payme / Click - both authenticate/verify in-handler (Payme via
// Basic auth, Click via its own MD5 signature), not via the protect middleware.
router.post('/payme', handlePaymeRequest);
router.post('/click', handleClickRequest);

// Protected endpoints for user billing UI
router.get('/plans', getBillingPlansController);
router.get('/me', protect, getMyBillingState);

export default router;
