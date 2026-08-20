import crypto from 'node:crypto';

export const generateExpiringToken = (ttlMs = 1000 * 60 * 60 * 24) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + ttlMs);

  return { token, tokenHash, expiresAt };
};

export const generateEmailVerificationToken = () => generateExpiringToken(1000 * 60 * 60 * 24);

export const generatePasswordResetToken = () => generateExpiringToken(1000 * 60 * 30);

export const hashEmailVerificationToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

export const hashToken = hashEmailVerificationToken;
