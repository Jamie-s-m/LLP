import express from 'express';
import { protect } from '../middleware/auth.js';
import { createCheckoutSession, createPortalSession, getBillingPlansController, getMyBillingState } from '../controllers/billingController.js';
import { handlePaymeRequest } from '../controllers/billingController.js';

const router = express.Router();

// Публичный эндпоинт для вебхуков Payme (JSON-RPC 2.0)
router.post('/payme', handlePaymeRequest);

// Эндпоинты для фронтенда и Stripe
router.get('/plans', getBillingPlansController);
router.get('/me', protect, getMyBillingState);
router.post('/checkout-session', protect, createCheckoutSession);
router.post('/portal-session', protect, createPortalSession);

export default router;