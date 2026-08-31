import User from '../models/User.js';
import Progress from '../models/Progress.js';
import UserAchievement from '../models/UserAchievement.js';
import { levelFromXp } from '../utils/level.js';
import { serializeHearts, applyHeartsRegen } from '../utils/hearts.js';
import { leaderboardCache } from '../utils/cacheHelpers.js';
import { BADGE_CATALOG, iconFor, colorFor, rarityFor, isBadgeUnlocked, badgeProgress } from '../data/badgeCatalog.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { firstName, lastName, nativeLanguage, targetLanguages } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (nativeLanguage) user.nativeLanguage = nativeLanguage;
    if (targetLanguages) user.targetLanguages = targetLanguages;

    await user.save();
    user.password = undefined;
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const LEARNING_GOALS = ['job', 'it', 'abroad', 'study', 'confidence', 'other'];
const SELF_ASSESSED_LEVELS = ['beginner', 'basic', 'intermediate', 'advanced', 'not_sure'];
const DAILY_GOAL_MINUTES = [10, 15, 30, 60];

// Saves the goal/self-assessment/time-commitment collected in the onboarding flow and marks
// it complete. Kept separate from updateProfile (a settings-page edit) because this is a
// one-time, ordered flow with its own validation and a completion timestamp that gates
// whether a returning student is routed back into onboarding.
export const completeOnboarding = async (req, res, next) => {
  try {
    const { learningGoal, selfAssessedLevel, dailyGoalMinutes } = req.body || {};

    if (!LEARNING_GOALS.includes(learningGoal)) {
      return res.status(400).json({ success: false, message: 'A valid learning goal is required' });
    }
    if (!SELF_ASSESSED_LEVELS.includes(selfAssessedLevel)) {
      return res.status(400).json({ success: false, message: 'A valid self-assessed level is required' });
    }
    if (!DAILY_GOAL_MINUTES.includes(Number(dailyGoalMinutes))) {
      return res.status(400).json({ success: false, message: 'A valid daily time commitment is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        learningGoal,
        selfAssessedLevel,
        dailyGoalMinutes: Number(dailyGoalMinutes),
        onboardingCompletedAt: new Date(),
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const [user, totalProgress] = await Promise.all([
      User.findById(req.user.id).select('-password'),
      Progress.find({ user: req.user.id }).populate('course')
    ]);

    const completedCourses = totalProgress.filter((item) => item.isCompleted).length;
    const totalXp = user?.xp || 0;

    if (user) {
      applyHeartsRegen(user);
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        totalCourses: totalProgress.length,
        completedCourses,
        totalXp,
        level: levelFromXp(totalXp),
        streak: user?.streak || 0,
        linguaCoins: user?.linguaCoins || 0,
        ...serializeHearts(user || {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    let leaderboard = await leaderboardCache.getLeaderboard('global', 20).catch(() => null);
    if (!leaderboard) {
      leaderboard = await User.find({ role: 'student', isActive: true })
        .select('firstName lastName xp streak avatar')
        .sort({ xp: -1 })
        .limit(20);
      leaderboardCache.setLeaderboard('global', leaderboard, 20).catch(() => {});
    }

    const currentUser = await User.findById(req.user.id).select('xp');
    const myRank = await User.countDocuments({
      role: 'student',
      isActive: true,
      xp: { $gt: currentUser?.xp || 0 },
    }) + 1;

    res.status(200).json({ success: true, data: { leaderboard, myRank } });
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (req, res, next) => {
  try {
    const achievements = await UserAchievement.find({ student: req.user.id })
      .populate('badge')
      .sort({ unlockedAt: -1 });

    res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
};

// Full badge catalog with earned/locked state + progress-to-unlock, unlike getAchievements
// above which only returns badges the user already has (nothing for a "locked" grid).
export const getAchievementsCatalog = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('xp dailyRewardStreak totalLinguaCoinsEarned');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const unlocked = await UserAchievement.find({ student: req.user.id }).populate('badge');
    const unlockedNames = new Set(unlocked.map((entry) => entry.badge?.name).filter(Boolean));

    const stats = {
      dailyStreak: user.dailyRewardStreak || 0,
      totalCoins: user.totalLinguaCoinsEarned || 0,
      totalXP: user.xp || 0,
    };

    const catalog = BADGE_CATALOG.map((entry) => {
      const earned = unlockedNames.has(entry.name) || isBadgeUnlocked(entry, stats);
      const unlockedEntry = unlocked.find((item) => item.badge?.name === entry.name);
      return {
        name: entry.name,
        description: entry.description,
        icon: iconFor(entry.name),
        color: colorFor(entry.category),
        category: entry.category,
        points: entry.points,
        rarity: rarityFor(entry.points),
        earned,
        unlockedAt: unlockedEntry?.unlockedAt || null,
        progress: earned ? 100 : badgeProgress(entry, stats),
      };
    });

    res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    next(error);
  }
};
