import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { generateEmailVerificationToken } from '../src/utils/emailVerification.js';

let userCounter = 0;
const makeUnverifiedUser = async () => {
  userCounter += 1;
  const { token, tokenHash, expiresAt } = generateEmailVerificationToken();
  const user = await User.create({
    firstName: 'Verify',
    lastName: `Tester${userCounter}`,
    email: `verify-tester-${userCounter}@example.com`,
    password: 'testpass123',
    role: 'student',
    isEmailVerified: false,
    emailVerificationToken: tokenHash,
    emailVerificationExpiresAt: expiresAt,
  });
  return { user, token };
};

// Regression coverage for a real bug found while building the Playwright E2E suite: this
// endpoint used to clear emailVerificationToken on first success, making it strictly single-use.
// A second identical GET with the same token - which genuinely happens in production, not just
// in a test double-firing an effect (corporate email scanners and link-safety proxies like
// Outlook Safe Links prefetch GET links in transactional email before the real recipient clicks
// them) - found no matching user and returned "invalid or expired" to the real user's own click.
describe('GET /api/auth/verify-email', () => {
  it('verifies a valid, unexpired token', async () => {
    const { user, token } = await makeUnverifiedUser();
    const res = await request(app).get('/api/auth/verify-email').query({ token });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const refreshed = await User.findById(user._id);
    expect(refreshed.isEmailVerified).toBe(true);
    await User.deleteOne({ _id: user._id });
  });

  it('is idempotent - the same token used a second time still succeeds instead of erroring', async () => {
    const { user, token } = await makeUnverifiedUser();
    const first = await request(app).get('/api/auth/verify-email').query({ token });
    expect(first.status).toBe(200);

    const second = await request(app).get('/api/auth/verify-email').query({ token });
    expect(second.status).toBe(200);
    expect(second.body.success).toBe(true);

    const refreshed = await User.findById(user._id);
    expect(refreshed.isEmailVerified).toBe(true);
    await User.deleteOne({ _id: user._id });
  });

  it('rejects a token that never existed', async () => {
    const res = await request(app).get('/api/auth/verify-email').query({ token: 'not-a-real-token' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects an expired token', async () => {
    userCounter += 1;
    const { tokenHash, token } = generateEmailVerificationToken();
    const user = await User.create({
      firstName: 'Verify',
      lastName: `Expired${userCounter}`,
      email: `verify-expired-${userCounter}@example.com`,
      password: 'testpass123',
      role: 'student',
      isEmailVerified: false,
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: new Date(Date.now() - 1000),
    });

    const res = await request(app).get('/api/auth/verify-email').query({ token });
    expect(res.status).toBe(400);

    const refreshed = await User.findById(user._id);
    expect(refreshed.isEmailVerified).toBe(false);
    await User.deleteOne({ _id: user._id });
  });

  it('rejects a request with no token at all', async () => {
    const res = await request(app).get('/api/auth/verify-email');
    expect(res.status).toBe(400);
  });
});
