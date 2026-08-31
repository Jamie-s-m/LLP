import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Onboarding API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    const user = await User.create({
      firstName: 'Onboard',
      lastName: 'Tester',
      email: 'onboarding-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    userId = user._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'onboarding-tester@example.com', password: 'testpass123' });
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await User.deleteOne({ _id: userId });
  });

  it('rejects an invalid learning goal', async () => {
    const res = await request(app)
      .put('/api/users/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ learningGoal: 'not-a-real-goal', selfAssessedLevel: 'beginner', dailyGoalMinutes: 15 });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid daily time commitment', async () => {
    const res = await request(app)
      .put('/api/users/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ learningGoal: 'it', selfAssessedLevel: 'beginner', dailyGoalMinutes: 45 });

    expect(res.status).toBe(400);
  });

  it('saves goal, self-assessed level, and daily minutes, and stamps completion', async () => {
    const res = await request(app)
      .put('/api/users/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ learningGoal: 'it', selfAssessedLevel: 'intermediate', dailyGoalMinutes: 15 });

    expect(res.status).toBe(200);
    expect(res.body.data.learningGoal).toBe('it');
    expect(res.body.data.selfAssessedLevel).toBe('intermediate');
    expect(res.body.data.dailyGoalMinutes).toBe(15);
    expect(res.body.data.onboardingCompletedAt).not.toBeNull();
    expect(res.body.data.password).toBeUndefined();

    const refreshed = await User.findById(userId);
    expect(refreshed.onboardingCompletedAt).not.toBeNull();
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .put('/api/users/onboarding')
      .send({ learningGoal: 'it', selfAssessedLevel: 'beginner', dailyGoalMinutes: 15 });

    expect(res.status).toBe(401);
  });
});
