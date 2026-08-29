import User from '../models/User.js';
import Badge from '../models/Badge.js';
import UserAchievement from '../models/UserAchievement.js';
import DailyRewardClaim from '../models/DailyRewardClaim.js';
import { BADGE_CATALOG, iconFor, colorFor, rarityFor, isBadgeUnlocked } from '../data/badgeCatalog.js';

// @desc    Claim daily reward
// @route   POST /api/daily-reward/claim
// @access  Private (Student)
export const claimDailyReward = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastReward = user.lastDailyRewardDate ? new Date(user.lastDailyRewardDate) : null;
    const lastRewardDay = lastReward ? new Date(lastReward.getFullYear(), lastReward.getMonth(), lastReward.getDate()) : null;

    // Check if already claimed today
    if (lastRewardDay && lastRewardDay.getTime() === today.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Daily reward already claimed today',
        data: { nextClaimAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      });
    }

    // Calculate streak
    let newDailyRewardStreak = 1;
    if (lastRewardDay) {
      const diffDays = (today.getTime() - lastRewardDay.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        // Consecutive day
        newDailyRewardStreak = user.dailyRewardStreak + 1;
      } else if (diffDays > 1) {
        // Streak broken
        newDailyRewardStreak = 1;
      }
    }

    // Calculate rewards based on streak
    const baseCoins = 10;
    const baseXP = 20;
    const streakMultiplier = Math.min(1 + (newDailyRewardStreak - 1) * 0.1, 3); // Cap at 3x
    const bonusCoins = newDailyRewardStreak >= 7 ? 50 : newDailyRewardStreak >= 3 ? 20 : 0;
    const milestoneBonusXP = newDailyRewardStreak % 7 === 0 ? 100 : newDailyRewardStreak % 30 === 0 ? 500 : 0;

    const earnedCoins = Math.floor((baseCoins * streakMultiplier) + bonusCoins);
    const earnedXP = Math.floor((baseXP * streakMultiplier) + milestoneBonusXP);

    const previousActiveDate = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

    // Update user
    user.linguaCoins = (user.linguaCoins || 0) + earnedCoins;
    user.totalLinguaCoinsEarned = (user.totalLinguaCoinsEarned || 0) + earnedCoins;
    user.xp = (user.xp || 0) + earnedXP;
    user.dailyRewardStreak = newDailyRewardStreak;
    user.lastDailyRewardDate = now;

    // Update streak if this is also a learning activity
    const lastActive = previousActiveDate;
    if (lastActive) {
      const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 3600);
      if (diffInHours >= 24 && diffInHours < 48) {
        user.streak = (user.streak || 0) + 1;
      } else if (diffInHours >= 48) {
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }

    await user.save();

    // Check for badge unlocks
    const unlockedBadges = await checkAndUnlockBadges(userId, newDailyRewardStreak, user.totalLinguaCoinsEarned, user.xp);

    // Log the claim for auditing (and for the streak-calendar history endpoint below)
    try {
      await DailyRewardClaim.create({
        user: userId,
        earnedCoins,
        earnedXP,
        streak: newDailyRewardStreak,
        ip: req.ip || req.headers['x-forwarded-for'] || '',
      })
    } catch (e) {
      // non-fatal
      console.warn('Failed to log daily reward claim', e)
    }

    res.status(200).json({
      success: true,
      message: 'Daily reward claimed successfully!',
      data: {
        earnedCoins,
        earnedXP,
        newDailyRewardStreak,
        newLinguaCoins: user.linguaCoins,
        newTotalXP: user.xp,
        newStreak: user.streak,
        unlockedBadges,
        nextClaimAvailable: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily reward status
// @route   GET /api/daily-reward/status
// @access  Private (Student)
export const getDailyRewardStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('linguaCoins totalLinguaCoinsEarned xp streak dailyRewardStreak lastDailyRewardDate lastActiveDate');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastReward = user.lastDailyRewardDate ? new Date(user.lastDailyRewardDate) : null;
    const lastRewardDay = lastReward ? new Date(lastReward.getFullYear(), lastReward.getMonth(), lastReward.getDate()) : null;

    const canClaim = !lastRewardDay || lastRewardDay.getTime() !== today.getTime();
    const nextClaimAvailable = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Calculate next day streak preview
    let nextStreak = 1;
    if (lastRewardDay) {
      const diffDays = (today.getTime() - lastRewardDay.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        nextStreak = user.dailyRewardStreak + 1;
      }
    }

    // Calculate preview rewards for tomorrow
    const baseCoins = 10;
    const baseXP = 20;
    const streakMultiplier = Math.min(1 + (nextStreak - 1) * 0.1, 3);
    const bonusCoins = nextStreak >= 7 ? 50 : nextStreak >= 3 ? 20 : 0;
    const milestoneBonusXP = nextStreak % 7 === 0 ? 100 : nextStreak % 30 === 0 ? 500 : 0;
    const previewCoins = Math.floor((baseCoins * streakMultiplier) + bonusCoins);
    const previewXP = Math.floor((baseXP * streakMultiplier) + milestoneBonusXP);

    res.status(200).json({
      success: true,
      data: {
        canClaim,
        currentStreak: user.dailyRewardStreak,
        nextStreak,
        previewCoins,
        previewXP,
        linguaCoins: user.linguaCoins,
        totalLinguaCoinsEarned: user.totalLinguaCoinsEarned,
        totalXP: user.xp,
        learningStreak: user.streak,
        lastClaimedAt: user.lastDailyRewardDate,
        nextClaimAvailable: canClaim ? null : nextClaimAvailable,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Read back the claim history log (previously write-only) for a streak calendar
// @route   GET /api/daily-reward/history
// @access  Private (Student)
export const getDailyRewardHistory = async (req, res, next) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const claims = await DailyRewardClaim.find({ user: req.user.id, claimedAt: { $gte: since } })
      .select('claimedAt earnedCoins earnedXP streak')
      .sort({ claimedAt: 1 });

    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    next(error);
  }
};

// @desc    Spend lingua coins
// @route   POST /api/daily-reward/spend
// @access  Private (Student)
export const spendLinguaCoins = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.linguaCoins || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient LinguaCoins' });
    }

    user.linguaCoins -= amount;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Spent ${amount} LinguaCoins on ${reason}`,
      data: { newBalance: user.linguaCoins },
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Check and unlock badges based on milestones (catalog lives in data/badgeCatalog.js
// so the achievements-catalog endpoint can also list locked badges + progress from it).
const checkAndUnlockBadges = async (userId, dailyStreak, totalCoins, totalXP) => {
  const unlockedBadges = [];
  const stats = { dailyStreak, totalCoins, totalXP };

  for (const entry of BADGE_CATALOG) {
    if (!isBadgeUnlocked(entry, stats)) continue;

    let badge = await Badge.findOne({ name: entry.name });
    if (!badge) {
      badge = await Badge.create({
        name: entry.name,
        description: entry.description,
        icon: iconFor(entry.name),
        color: colorFor(entry.category),
        requirement: entry.description,
        category: entry.category,
        points: entry.points,
        rarity: rarityFor(entry.points),
      });
    }

    const existing = await UserAchievement.findOne({ student: userId, badge: badge._id });
    if (!existing) {
      await UserAchievement.create({
        student: userId,
        badge: badge._id,
      });
      unlockedBadges.push({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        points: badge.points,
        rarity: badge.rarity,
      });
    }
  }

  return unlockedBadges;
};