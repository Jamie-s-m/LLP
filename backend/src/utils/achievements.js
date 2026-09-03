import User from '../models/User.js';
import Badge from '../models/Badge.js';
import UserAchievement from '../models/UserAchievement.js';
import { BADGE_CATALOG, iconFor, colorFor, rarityFor, isBadgeUnlocked } from '../data/badgeCatalog.js';

// Previously this check-and-award loop only ran inside dailyRewardController.js's claim
// handler, but getAchievementsCatalog computes a badge's `earned` flag live against a user's
// CURRENT stats (isBadgeUnlocked), regardless of how those stats got there. Net effect: a
// learner who crossed an XP/coin threshold purely through exercise or lesson completion (never
// claiming a daily reward) would see a badge marked "earned" in the catalog with no
// UserAchievement record, no unlockedAt timestamp, and no unlock moment ever having fired for
// them - the display and the persistence/notification layer were on two different triggers.
// Fetches the user's current stats itself (rather than requiring every caller to know/compute
// dailyRewardStreak/totalLinguaCoinsEarned/xp) so any XP- or coin-awarding code path can call
// this with nothing but the user id, right after saving whatever change it just made.
export const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId).select('dailyRewardStreak totalLinguaCoinsEarned xp');
  if (!user) return [];

  const stats = {
    dailyStreak: user.dailyRewardStreak || 0,
    totalCoins: user.totalLinguaCoinsEarned || 0,
    totalXP: user.xp || 0,
  };

  const unlockedBadges = [];

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
