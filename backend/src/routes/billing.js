import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  getBillingPlansController, 
  getMyBillingState, 
  createCheckoutSession, 
  createPortalSession,
  handlePaymeRequest 
} from '../controllers/billingController.js';

const router = express.Router();

// Public JSON-RPC endpoint for Payme Webhooks / Callbacks
router.post('/payme', handlePaymeRequest);

// Protected endpoints for user billing UI
router.get('/plans', getBillingPlansController);
router.get('/me', protect, getMyBillingState);
router.post('/checkout-session', protect, createCheckoutSession);
router.post('/portal-session', protect, createPortalSession);

export default router;