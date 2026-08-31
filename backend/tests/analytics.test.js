import request from 'supertest';
import app from '../src/app.js';
import AnalyticsEvent from '../src/models/AnalyticsEvent.js';
import User from '../src/models/User.js';

describe('Analytics API', () => {
  it('rejects an unknown event name', async () => {
    const res = await request(app).post('/api/analytics/track').send({ event: 'made_up_event' });
    expect(res.status).toBe(400);
  });

  it('records an anonymous event with sanitized metadata', async () => {
    const res = await request(app).post('/api/analytics/track').send({
      event: 'pricing_viewed',
      anonymousId: 'anon-123',
      path: '/pricing',
      metadata: { plan: 'local', email: 'should-be-stripped@example.com', password: 'secret', nested: { a: 1 } },
    });
    expect(res.status).toBe(204);

    const stored = await AnalyticsEvent.findOne({ event: 'pricing_viewed', anonymousId: 'anon-123' });
    expect(stored).not.toBeNull();
    expect(stored.user).toBeNull();
    expect(stored.metadata.plan).toBe('local');
    expect(stored.metadata.email).toBeUndefined();
    expect(stored.metadata.password).toBeUndefined();
    expect(stored.metadata.nested).toBeUndefined();
  });

  it('links an event to the authenticated user', async () => {
    const user = await User.create({
      firstName: 'Analytics',
      lastName: 'Tester',
      email: 'analytics-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analytics-tester@example.com', password: 'testpass123' });
    const token = loginRes.body.token;

    await request(app)
      .post('/api/analytics/track')
      .set('Authorization', `Bearer ${token}`)
      .send({ event: 'lesson_started', metadata: { lessonId: 'abc123' } });

    const stored = await AnalyticsEvent.findOne({ event: 'lesson_started', user: user._id });
    expect(stored).not.toBeNull();
    expect(stored.metadata.lessonId).toBe('abc123');
  });

  it('never fails the request even with a malformed body', async () => {
    const res = await request(app).post('/api/analytics/track').send('not json at all');
    expect([204, 400]).toContain(res.status);
  });
});
