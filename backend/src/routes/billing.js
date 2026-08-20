import express from 'express';
import { protect } from '../middleware/auth.js';
import { createCheckoutSession, createPortalSession, getBillingPlansController, getMyBillingState } from '../controllers/billingController.js';

const router = express.Router();

router.get('/plans', getBillingPlansController);
router.get('/me', protect, getMyBillingState);
router.post('/checkout-session', protect, createCheckoutSession);
router.post('/portal-session', protect, createPortalSession);

export default router;
