import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import DailyRewardClaim from '../src/models/DailyRewardClaim.js';

describe('Daily Reward API', () => {
  const testEmail = 'dailytest@example.com';
  const testPassword = 'testpass123';
  let token;
  let userId;

  beforeAll(async () => {
    // create user
    const user = await User.create({
      firstName: 'Daily',
      lastName: 'Tester',
      email: testEmail,
      password: testPassword,
      role: 'student',
      isEmailVerified: true,
    });
    userId = user._id;

    const res = await request(app).post('/api/auth/login').send({ email: testEmail, password: testPassword });
    token = res.body.token;
  });

  afterAll(async () => {
    // cleanup
    await User.deleteOne({ email: testEmail });
    await DailyRewardClaim.deleteMany({ user: userId });
  });

  test('GET /api/daily-reward/status returns status and canClaim', async () => {
    const res = await request(app).get('/api/daily-reward/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('canClaim');
  });

  test('POST /api/daily-reward/claim awards coins and logs claim', async () => {
    const res = await request(app).post('/api/daily-reward/claim').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('earnedCoins');

    // verify claim logged
    const claims = await DailyRewardClaim.find({ user: userId });
    expect(claims.length).toBeGreaterThanOrEqual(1);
  });

  test('Second claim on same day is rejected', async () => {
    const res = await request(app).post('/api/daily-reward/claim').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/daily-reward/spend decreases balance when sufficient', async () => {
    // attempt to spend 1 coin
    const spendRes = await request(app).post('/api/daily-reward/spend').set('Authorization', `Bearer ${token}`).send({ amount: 1, reason: 'test spend' });
    if (spendRes.status === 200) {
      expect(spendRes.body.success).toBe(true);
      expect(spendRes.body.data).toHaveProperty('newBalance');
    } else {
      // possible insufficient balance (if earnedCoins was 0) - expect 400
      expect(spendRes.status).toBe(400);
    }
  });
});

describe('Daily Reward concurrency', () => {
  const testEmail = 'dailyrace@example.com';
  const testPassword = 'testpass123';
  let token;
  let userId;

  beforeAll(async () => {
    const user = await User.create({
      firstName: 'Race',
      lastName: 'Tester',
      email: testEmail,
      password: testPassword,
      role: 'student',
      isEmailVerified: true,
    });
    userId = user._id;

    const res = await request(app).post('/api/auth/login').send({ email: testEmail, password: testPassword });
    token = res.body.token;
  });

  afterAll(async () => {
    await User.deleteOne({ email: testEmail });
    await DailyRewardClaim.deleteMany({ user: userId });
  });

  test('firing 5 concurrent claims only awards the reward once', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(app).post('/api/daily-reward/claim').set('Authorization', `Bearer ${token}`))
    );

    const successes = responses.filter((res) => res.status === 200);
    const rejections = responses.filter((res) => res.status === 400);
    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(4);

    const claims = await DailyRewardClaim.find({ user: userId });
    expect(claims.length).toBe(1);

    const user = await User.findById(userId);
    expect(user.linguaCoins).toBe(successes[0].body.data.earnedCoins);
  });
});
