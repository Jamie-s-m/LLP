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
    if (badge) {
      // Self-healing: a Badge document created before badgeCatalog.js's icon/color values last
      // changed (e.g. the emoji-to-Phosphor-icon-key migration) would otherwise keep serving its
      // stale stored icon/color forever, since this lookup only creates a new document when none
      // exists - the exact "stored copy drifts from the real source" bug class already fixed
      // elsewhere in this app for priceLabel/mrrUzs. Syncing on every award-check is cheap and
      // keeps every already-earned badge's display current with the catalog's latest definition.
      const freshIcon = iconFor(entry.name);
      const freshColor = colorFor(entry.category);
      if (badge.icon !== freshIcon || badge.color !== freshColor) {
        badge.icon = freshIcon;
        badge.color = freshColor;
        await badge.save();
      }
    }
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
