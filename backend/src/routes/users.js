import express from 'express';
import { protect } from '../middleware/auth.js';
import { getProfile, updateProfile, getDashboardSummary } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/dashboard-summary', protect, getDashboardSummary);

export default router;