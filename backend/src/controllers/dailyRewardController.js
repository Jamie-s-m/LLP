import User from '../models/User.js';
import Badge from '../models/Badge.js';
import UserAchievement from '../models/UserAchievement.js';

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

    // Log the claim for auditing
    try {
      const DailyRewardClaim = await import('../models/DailyRewardClaim.js')
      await DailyRewardClaim.default.create({
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

// Helper: Check and unlock badges based on milestones
const checkAndUnlockBadges = async (userId, dailyStreak, totalCoins, totalXP) => {
  const unlockedBadges = [];

  // Define badge criteria
  const badgeCriteria = [
    // Streak badges
    { name: 'First Steps', requirement: 'Claim daily reward for 1 day', category: 'streak', points: 10, condition: dailyStreak >= 1 },
    { name: 'Three Day Streak', requirement: 'Claim daily reward for 3 consecutive days', category: 'streak', points: 25, condition: dailyStreak >= 3 },
    { name: 'Week Warrior', requirement: 'Claim daily reward for 7 consecutive days', category: 'streak', points: 100, condition: dailyStreak >= 7 },
    { name: 'Month Master', requirement: 'Claim daily reward for 30 consecutive days', category: 'streak', points: 500, condition: dailyStreak >= 30 },
    { name: 'Century Streak', requirement: 'Claim daily reward for 100 consecutive days', category: 'streak', points: 1000, condition: dailyStreak >= 100 },
    // Coin badges
    { name: 'Coin Collector', requirement: 'Earn 100 LinguaCoins total', category: 'achievement', points: 50, condition: totalCoins >= 100 },
    { name: 'Wealth Builder', requirement: 'Earn 500 LinguaCoins total', category: 'achievement', points: 200, condition: totalCoins >= 500 },
    { name: 'Coin Millionaire', requirement: 'Earn 10,000 LinguaCoins total', category: 'achievement', points: 1000, condition: totalCoins >= 10000 },
    // XP badges
    { name: 'Rising Star', requirement: 'Earn 500 XP total', category: 'milestone', points: 50, condition: totalXP >= 500 },
    { name: 'Language Learner', requirement: 'Earn 2,000 XP total', category: 'milestone', points: 200, condition: totalXP >= 2000 },
    { name: 'Polyglot Pro', requirement: 'Earn 10,000 XP total', category: 'milestone', points: 1000, condition: totalXP >= 10000 },
  ];

  for (const criteria of badgeCriteria) {
    if (!criteria.condition) continue;

    // Check if badge exists
    let badge = await Badge.findOne({ name: criteria.name });
    if (!badge) {
      // Create badge if it doesn't exist
      badge = await Badge.create({
        name: criteria.name,
        description: criteria.requirement,
        icon: getBadgeIcon(criteria.name),
        color: getBadgeColor(criteria.category),
        requirement: criteria.requirement,
        category: criteria.category,
        points: criteria.points,
        rarity: getRarity(criteria.points),
      });
    }

    // Check if user already has this badge
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

const getBadgeIcon = (name) => {
  const icons = {
    'First Steps': '🌱',
    'Three Day Streak': '🔥',
    'Week Warrior': '⚡',
    'Month Master': '👑',
    'Century Streak': '💎',
    'Coin Collector': '🪙',
    'Wealth Builder': '💰',
    'Coin Millionaire': '💎',
    'Rising Star': '⭐',
    'Language Learner': '🌟',
    'Polyglot Pro': '🏆',
  };
  return icons[name] || '🏅';
};

const getBadgeColor = (category) => {
  const colors = {
    streak: '#FF6B35',
    achievement: '#FFD700',
    milestone: '#5B5CE2',
    special: '#36C9A5',
  };
  return colors[category] || '#5B5CE2';
};

const getRarity = (points) => {
  if (points >= 1000) return 'legendary';
  if (points >= 500) return 'epic';
  if (points >= 200) return 'rare';
  if (points >= 50) return 'uncommon';
  return 'common';
};