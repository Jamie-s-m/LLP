import express from 'express'
import { claimDailyReward, getDailyRewardStatus, spendLinguaCoins, getDailyRewardHistory } from '../controllers/dailyRewardController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Protected routes for students
router.get('/status', protect, getDailyRewardStatus)
router.post('/claim', protect, claimDailyReward)
router.post('/spend', protect, spendLinguaCoins)
router.get('/history', protect, getDailyRewardHistory)

export default router
