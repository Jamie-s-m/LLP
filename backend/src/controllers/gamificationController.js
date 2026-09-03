import User from '../models/User.js';
import { applyHeartsRegen, serializeHearts } from '../utils/hearts.js';

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

    const maxHearts = typeof user.maxHearts === 'number' ? user.maxHearts : 5;

    // Atomic conditional decrement, same pattern dailyRewardController.spendLinguaCoins already
    // uses for the identical operation class - the read-then-write above (check user.linguaCoins
    // in JS, then save) let two concurrent requests (double-tap, two tabs/devices) both read the
    // same pre-deduction balance and both pass the sufficiency check, a double-spend that granted
    // more heart-refills than coins actually paid for. The check above still gives a fast,
    // friendly 400 for the common case; this is the real enforcement against the race.
    const updated = await User.findOneAndUpdate(
      { _id: req.user.id, linguaCoins: { $gte: HEART_REFILL_COST } },
      { $inc: { linguaCoins: -HEART_REFILL_COST }, $set: { hearts: maxHearts, heartsRegenAt: null } },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: `You need ${HEART_REFILL_COST} coins to refill hearts`,
        data: { ...serializeHearts(user), linguaCoins: user.linguaCoins || 0, cost: HEART_REFILL_COST },
      });
    }

    return res.status(200).json({ success: true, data: { ...serializeHearts(updated), linguaCoins: updated.linguaCoins } });
  } catch (err) {
    next(err);
  }
};
