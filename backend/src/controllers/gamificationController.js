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
