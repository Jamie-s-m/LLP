import User from '../models/User.js';

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
