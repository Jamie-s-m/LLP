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

  // Regression coverage for a Phase 3 security-re-audit finding: the original key-name denylist
  // didn't cover 'fullName', 'ssn', 'dob', or 'note'/'comment'-shaped fields, so an
  // unauthenticated POST could store a fake SSN, full name, date of birth, and a free-text note
  // verbatim - demonstrated live by the audit against this exact route.
  it('strips PII by key name (fullName, ssn, dob, note) that the old denylist missed', async () => {
    const res = await request(app).post('/api/analytics/track').send({
      event: 'pricing_viewed',
      anonymousId: 'anon-pii-1',
      metadata: {
        ssn: '123-45-6789',
        fullName: 'Jane Q. Attacker',
        dob: '1990-01-01',
        note: 'wants a refund to her personal bank account',
        plan: 'local',
      },
    });
    expect(res.status).toBe(204);

    const stored = await AnalyticsEvent.findOne({ event: 'pricing_viewed', anonymousId: 'anon-pii-1' });
    expect(stored.metadata.ssn).toBeUndefined();
    expect(stored.metadata.fullName).toBeUndefined();
    expect(stored.metadata.dob).toBeUndefined();
    expect(stored.metadata.note).toBeUndefined();
    expect(stored.metadata.plan).toBe('local');
  });

  it('strips a value that LOOKS like PII regardless of what its key is named', async () => {
    const res = await request(app).post('/api/analytics/track').send({
      event: 'pricing_viewed',
      anonymousId: 'anon-pii-2',
      metadata: {
        // Renamed keys an attacker might use to dodge a key-name-only denylist.
        taxId: '123-45-6789',
        contact: 'attacker@example.com',
        cardRef: '4111111111111111',
        plan: 'learner',
      },
    });
    expect(res.status).toBe(204);

    const stored = await AnalyticsEvent.findOne({ event: 'pricing_viewed', anonymousId: 'anon-pii-2' });
    expect(stored.metadata.taxId).toBeUndefined();
    expect(stored.metadata.contact).toBeUndefined();
    expect(stored.metadata.cardRef).toBeUndefined();
    expect(stored.metadata.plan).toBe('learner');
  });

  it('still allows short, real-shaped values (plan keys, ids, booleans, counts)', async () => {
    const res = await request(app).post('/api/analytics/track').send({
      event: 'exercise_completed',
      anonymousId: 'anon-legit-1',
      metadata: { exerciseId: '507f1f77bcf86cd799439011', type: 'multiple_choice', correct: true, streak: 5 },
    });
    expect(res.status).toBe(204);

    const stored = await AnalyticsEvent.findOne({ event: 'exercise_completed', anonymousId: 'anon-legit-1' });
    expect(stored.metadata.exerciseId).toBe('507f1f77bcf86cd799439011');
    expect(stored.metadata.type).toBe('multiple_choice');
    expect(stored.metadata.correct).toBe(true);
    expect(stored.metadata.streak).toBe(5);
  });

  it('never fails the request even with a malformed body', async () => {
    const res = await request(app).post('/api/analytics/track').send('not json at all');
    expect([204, 400]).toContain(res.status);
  });

  // Regression coverage for a release blocker: an unauthenticated POST to this exact route
  // with event=payment_completed or event=subscription_cancelled used to be accepted and
  // wrote a real AnalyticsEvent row that GET /api/admin/business-metrics reads
  // (cancellationsLast30d) - a single anonymous HTTP request could move a founder-facing
  // revenue metric. These events must now be indistinguishable from any other unrecognized
  // event name from this route's point of view.
  describe('monetization events cannot be forged through the public endpoint', () => {
    it.each(['payment_completed', 'subscription_cancelled', 'payment_refunded'])(
      'rejects an unauthenticated %s event and never stores it',
      async (event) => {
        const res = await request(app)
          .post('/api/analytics/track')
          .send({ event, metadata: { provider: 'stripe', plan: 'learner' } });

        expect(res.status).toBe(400);
        const stored = await AnalyticsEvent.findOne({ event });
        expect(stored).toBeNull();
      }
    );

    it('also rejects the same events when sent by an authenticated user', async () => {
      const user = await User.create({
        firstName: 'Would-Be',
        lastName: 'Forger',
        email: 'analytics-forger@example.com',
        password: 'testpass123',
        role: 'student',
        isEmailVerified: true,
      });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'analytics-forger@example.com', password: 'testpass123' });

      const res = await request(app)
        .post('/api/analytics/track')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .send({ event: 'subscription_cancelled' });

      expect(res.status).toBe(400);
      const stored = await AnalyticsEvent.findOne({ event: 'subscription_cancelled', user: user._id });
      expect(stored).toBeNull();
    });
  });
});
