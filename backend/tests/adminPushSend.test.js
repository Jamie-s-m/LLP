import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET || 'local-development-only-secret',
  { expiresIn: '1h' }
);

// Regression coverage for a release blocker found during the Phase 3 security re-audit:
// POST /api/admin/push/send used to accept authorize('admin') OR just the 'supportChat'
// moderator permission - a permission that exists only to pick eligible support staff for a
// chat conversation (chatController.js), unrelated to sending push notifications. A moderator
// granted nothing but that one narrow permission could broadcast an arbitrary spoofed
// title/body notification, carrying the trusted LinguaNest icon, to any set of userIds with no
// further scoping. Fixed to require authorize('admin') only.
describe('POST /api/admin/push/send authorization', () => {
  it('rejects a moderator whose only permission is supportChat', async () => {
    const moderator = await User.create({
      firstName: 'Support', lastName: 'Only', email: 'push-send-supportchat@linguanest.local',
      password: 'Password123!', role: 'moderator', isEmailVerified: true,
      moderatorPermissions: { communityModeration: false, supportChat: true, catalogContentQa: false, limitedUserManagement: false },
    });

    const res = await request(app)
      .post('/api/admin/push/send')
      .set('Authorization', `Bearer ${signToken(moderator)}`)
      .send({ userIds: ['000000000000000000000000'], payload: { title: 'Spoofed', body: 'Not really from LinguaNest' } });

    expect(res.status).toBe(403);
  });

  it('rejects a moderator with every OTHER permission but not admin role', async () => {
    const moderator = await User.create({
      firstName: 'Almost', lastName: 'Admin', email: 'push-send-nearly-admin@linguanest.local',
      password: 'Password123!', role: 'moderator', isEmailVerified: true,
      moderatorPermissions: { communityModeration: true, supportChat: true, catalogContentQa: true, limitedUserManagement: true },
    });

    const res = await request(app)
      .post('/api/admin/push/send')
      .set('Authorization', `Bearer ${signToken(moderator)}`)
      .send({ userIds: ['000000000000000000000000'] });

    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/api/admin/push/send').send({ userIds: ['000000000000000000000000'] });
    expect(res.status).toBe(401);
  });

  it('an admin passes the authorization gate (may still fail downstream on push config, not auth)', async () => {
    const admin = await User.create({
      firstName: 'Push', lastName: 'Admin', email: 'push-send-admin@linguanest.local',
      password: 'Password123!', role: 'admin', isEmailVerified: true,
    });

    const res = await request(app)
      .post('/api/admin/push/send')
      .set('Authorization', `Bearer ${signToken(admin)}`)
      .send({ userIds: ['000000000000000000000000'] });

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
