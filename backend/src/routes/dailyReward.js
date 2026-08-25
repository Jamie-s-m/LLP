import express from 'express'
import { claimDailyReward, getDailyRewardStatus, spendLinguaCoins } from '../controllers/dailyRewardController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Protected routes for students
router.get('/status', protect, getDailyRewardStatus)
router.post('/claim', protect, claimDailyReward)
router.post('/spend', protect, spendLinguaCoins)

export default router
