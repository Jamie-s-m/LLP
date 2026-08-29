// XP required to advance one level. Tune this constant to rebalance progression pacing.
const XP_PER_LEVEL = 500;

export const levelFromXp = (xp = 0) => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

export const xpIntoCurrentLevel = (xp = 0) => Math.max(0, xp) % XP_PER_LEVEL;

export const xpForNextLevel = () => XP_PER_LEVEL;

export default levelFromXp;
