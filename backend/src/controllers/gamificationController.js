import User from '../models/User.js';
import { applyHeartsRegen, refillHearts, serializeHearts } from '../utils/hearts.js';

// Coin cost to instantly refill hearts to full. Tune this constant to rebalance the economy.
export const HEART_REFILL_COST = 50;

// Current heart count for the authenticated user, with any owed regeneration applied.
export const getHearts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    applyHeartsRegen(user);
    await user.save();

    return res.status(200).json({ success: true, data: serializeHearts(user) });
  } catch (err) {
    next(err);
  }
};

// Instantly refill hearts to full by spending coins.
export const refillHeartsWithCoins = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    applyHeartsRegen(user);
    if (user.hearts >= (user.maxHearts || 5)) {
      return res.status(400).json({ success: false, message: 'Hearts are already full', data: serializeHearts(user) });
    }

    if ((user.linguaCoins || 0) < HEART_REFILL_COST) {
      return res.status(400).json({
        success: false,
        message: `You need ${HEART_REFILL_COST} coins to refill hearts`,
        data: { ...serializeHearts(user), linguaCoins: user.linguaCoins || 0, cost: HEART_REFILL_COST },
      });
    }

    user.linguaCoins -= HEART_REFILL_COST;
    refillHearts(user);
    await user.save();

    return res.status(200).json({ success: true, data: { ...serializeHearts(user), linguaCoins: user.linguaCoins } });
  } catch (err) {
    next(err);
  }
};

// Award XP to the authenticated user
export const awardXP = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { amount = 0, reason = 'reward' } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const value = Number(amount) || 0;
    if (value <= 0) return res.status(400).json({ success: false, message: 'Invalid XP amount' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.xp = (user.xp || 0) + value;
    user.lastActiveDate = new Date();
    await user.save();

    return res.status(200).json({ success: true, data: { xp: user.xp, reason } });
  } catch (err) {
    next(err);
  }
};

// Award lingua coins to the authenticated user
export const awardCoins = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { amount = 0, reason = 'reward' } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const value = Math.floor(Number(amount) || 0);
    if (value <= 0) return res.status(400).json({ success: false, message: 'Invalid coins amount' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.linguaCoins = (user.linguaCoins || 0) + value;
    user.totalLinguaCoinsEarned = (user.totalLinguaCoinsEarned || 0) + value;
    user.lastActiveDate = new Date();
    await user.save();

    return res.status(200).json({ success: true, data: { linguaCoins: user.linguaCoins, totalLinguaCoinsEarned: user.totalLinguaCoinsEarned, reason } });
  } catch (err) {
    next(err);
  }
};
