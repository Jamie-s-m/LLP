import express from 'express';
import { protect } from '../middleware/auth.js';
import { getProfile, updateProfile, completeOnboarding, getDashboardSummary, getLeaderboard, getAchievements, getAchievementsCatalog } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/onboarding', protect, completeOnboarding);
router.get('/dashboard-summary', protect, getDashboardSummary);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/achievements', protect, getAchievements);
router.get('/achievements/catalog', protect, getAchievementsCatalog);

export default router;