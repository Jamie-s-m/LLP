// Hearts (lesson/exercise lives) regeneration. Tune this constant to rebalance pacing.
export const HEART_REGEN_INTERVAL_MS = 2 * 60 * 60 * 1000; // 1 heart every 2 hours

const getMaxHearts = (user) => (typeof user.maxHearts === 'number' ? user.maxHearts : 5);

// Applies any hearts regenerated since the last check. Mutates and returns the user document
// (caller is responsible for saving). Safe to call before every hearts-related read or write.
export const applyHeartsRegen = (user) => {
  const maxHearts = getMaxHearts(user);
  if (typeof user.hearts !== 'number') {
    user.hearts = maxHearts;
  }

  if (user.hearts >= maxHearts) {
    user.heartsRegenAt = null;
    return user;
  }

  if (!user.heartsRegenAt) {
    user.heartsRegenAt = new Date(Date.now() + HEART_REGEN_INTERVAL_MS);
    return user;
  }

  const now = Date.now();
  let regenAt = user.heartsRegenAt.getTime();
  let regenerated = 0;

  while (regenAt <= now && user.hearts + regenerated < maxHearts) {
    regenerated += 1;
    regenAt += HEART_REGEN_INTERVAL_MS;
  }

  if (regenerated > 0) {
    user.hearts = Math.min(maxHearts, user.hearts + regenerated);
  }

  user.heartsRegenAt = user.hearts >= maxHearts ? null : new Date(regenAt);
  return user;
};

export const loseHeart = (user) => {
  const maxHearts = getMaxHearts(user);
  if (typeof user.hearts !== 'number') user.hearts = maxHearts;
  if (user.hearts > 0) user.hearts -= 1;
  if (!user.heartsRegenAt && user.hearts < maxHearts) {
    user.heartsRegenAt = new Date(Date.now() + HEART_REGEN_INTERVAL_MS);
  }
  return user;
};

export const refillHearts = (user) => {
  user.hearts = getMaxHearts(user);
  user.heartsRegenAt = null;
  return user;
};

export const serializeHearts = (user) => ({
  hearts: typeof user.hearts === 'number' ? user.hearts : getMaxHearts(user),
  maxHearts: getMaxHearts(user),
  heartsRegenAt: user.heartsRegenAt || null,
});
