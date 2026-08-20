import express from 'express';
import { protect } from '../middleware/auth.js';
import { getProfile, updateProfile, getDashboardSummary, getLeaderboard, getAchievements } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/dashboard-summary', protect, getDashboardSummary);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/achievements', protect, getAchievements);

export default router;