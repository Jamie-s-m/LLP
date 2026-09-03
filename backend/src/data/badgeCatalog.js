// Formal badge catalog, shared by the daily-reward unlock check and the
// achievements catalog endpoint (which needs to show locked badges + progress,
// not just what a user has already earned). Previously this lived only as an
// inline array inside dailyRewardController with no way to list locked badges.
export const BADGE_CATALOG = [
  { name: 'First Steps', description: 'Claim daily reward for 1 day', category: 'streak', points: 10, statKey: 'dailyStreak', threshold: 1 },
  { name: 'Three Day Streak', description: 'Claim daily reward for 3 consecutive days', category: 'streak', points: 25, statKey: 'dailyStreak', threshold: 3 },
  { name: 'Week Warrior', description: 'Claim daily reward for 7 consecutive days', category: 'streak', points: 100, statKey: 'dailyStreak', threshold: 7 },
  { name: 'Month Master', description: 'Claim daily reward for 30 consecutive days', category: 'streak', points: 500, statKey: 'dailyStreak', threshold: 30 },
  { name: 'Century Streak', description: 'Claim daily reward for 100 consecutive days', category: 'streak', points: 1000, statKey: 'dailyStreak', threshold: 100 },
  { name: 'Coin Collector', description: 'Earn 100 LinguaCoins total', category: 'achievement', points: 50, statKey: 'totalCoins', threshold: 100 },
  { name: 'Wealth Builder', description: 'Earn 500 LinguaCoins total', category: 'achievement', points: 200, statKey: 'totalCoins', threshold: 500 },
  { name: 'Coin Millionaire', description: 'Earn 10,000 LinguaCoins total', category: 'achievement', points: 1000, statKey: 'totalCoins', threshold: 10000 },
  { name: 'Rising Star', description: 'Earn 500 XP total', category: 'milestone', points: 50, statKey: 'totalXP', threshold: 500 },
  { name: 'Language Learner', description: 'Earn 2,000 XP total', category: 'milestone', points: 200, statKey: 'totalXP', threshold: 2000 },
  { name: 'Polyglot Pro', description: 'Earn 10,000 XP total', category: 'milestone', points: 1000, statKey: 'totalXP', threshold: 10000 },
];

// Icon KEYS, not glyphs - this app's own established rule is no emoji anywhere in UI chrome
// (confirmed elsewhere in the codebase), which this catalog was violating directly. Each key
// names a real Phosphor icon component (frontend/src/utils/badgeIcons.tsx maps these to the
// actual React components, since a JSON API response can carry a string but not a component).
const ICONS = {
  'First Steps': 'PiPlantDuotone',
  'Three Day Streak': 'PiFlameDuotone',
  'Week Warrior': 'PiLightningDuotone',
  'Month Master': 'PiCrownDuotone',
  'Century Streak': 'PiDiamondDuotone',
  'Coin Collector': 'PiCoinDuotone',
  'Wealth Builder': 'PiCoinsDuotone',
  'Coin Millionaire': 'PiWalletDuotone',
  'Rising Star': 'PiStarDuotone',
  'Language Learner': 'PiSparkleDuotone',
  'Polyglot Pro': 'PiTrophyDuotone',
};

// Real brand tokens (frontend/src/index.css / tailwind.config.js) instead of raw hex values
// unrelated to the live design system - terracotta/pine/wine are this app's actual primary/
// secondary/accent colors.
const CATEGORY_COLORS = {
  streak: '#C84B31', // terracotta - momentum/energy
  achievement: '#3F6B52', // pine - growth/wealth (coin-based badges)
  milestone: '#7C2D42', // wine - prestige/mastery (XP-based badges)
  special: '#3E6FA6', // sky - reserved for a future badge category
};

export const iconFor = (name) => ICONS[name] || '🏅';
export const colorFor = (category) => CATEGORY_COLORS[category] || '#5B5CE2';

export const rarityFor = (points) => {
  if (points >= 1000) return 'legendary';
  if (points >= 500) return 'epic';
  if (points >= 200) return 'rare';
  if (points >= 50) return 'uncommon';
  return 'common';
};

export const isBadgeUnlocked = (entry, stats) => (stats[entry.statKey] || 0) >= entry.threshold;

export const badgeProgress = (entry, stats) =>
  Math.min(100, Math.round(((stats[entry.statKey] || 0) / entry.threshold) * 100));
