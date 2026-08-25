import mongoose from 'mongoose'

const dailyClaimSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  claimedAt: { type: Date, default: Date.now },
  earnedCoins: { type: Number, default: 0 },
  earnedXP: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  ip: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('DailyRewardClaim', dailyClaimSchema)
