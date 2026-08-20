import crypto from 'node:crypto';

export const generateEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  return { token, tokenHash, expiresAt };
};

export const hashEmailVerificationToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');
