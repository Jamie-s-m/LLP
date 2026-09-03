import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Rate Limiting Tests', () => {
  it('enforces authentication rate limits', async () => {
    const requests = [];

    // Make 15 requests (limit is 10)
    for (let i = 0; i < 15; i++) {
      requests.push(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'test123' })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);

    expect(rateLimited).toBe(true);
  }, 30000);
});

describe('Security Headers Tests', () => {
  it('sets security headers', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  it('sanitizes MongoDB injection attempts', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $ne: null },
        password: { $ne: null }
      });

    expect(response.status).not.toBe(200);
  });
});

// Regression coverage for real gaps this codebase has hit before (Payme/Click signature
// forgery is already covered in payme.test.js/click.test.js) - this suite is the general
// cross-cutting security net, not duplicating those feature-specific tests.
describe('JWT tampering', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';
  let student;

  beforeAll(async () => {
    student = await User.create({
      firstName: 'Security', lastName: 'Tester', email: 'security-jwt-tester@example.com', password: 'testpass123', role: 'student', isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: student._id });
  });

  it('rejects a token with a tampered signature', async () => {
    const validToken = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
    const [header, payload, signature] = validToken.split('.');
    const flippedChar = signature[0] === 'a' ? 'b' : 'a';
    const tamperedToken = [header, payload, flippedChar + signature.slice(1)].join('.');

    const res = await request(app).get('/api/users/dashboard-summary').set('Authorization', `Bearer ${tamperedToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret entirely', async () => {
    const forgedToken = jwt.sign({ id: student._id, role: 'admin' }, 'a-completely-different-guessed-secret', { expiresIn: '1h' });
    const res = await request(app).get('/api/admin/business-metrics').set('Authorization', `Bearer ${forgedToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET, { expiresIn: '-1h' });
    const res = await request(app).get('/api/users/dashboard-summary').set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects a structurally malformed bearer token', async () => {
    const res = await request(app).get('/api/users/dashboard-summary').set('Authorization', 'Bearer not-a-real-jwt-at-all');
    expect(res.status).toBe(401);
  });
});

describe('Admin route protection', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';
  let student;
  let teacher;

  beforeAll(async () => {
    student = await User.create({
      firstName: 'Security', lastName: 'Student', email: 'security-admin-student@example.com', password: 'testpass123', role: 'student', isEmailVerified: true,
    });
    teacher = await User.create({
      firstName: 'Security', lastName: 'Teacher', email: 'security-admin-teacher@example.com', password: 'testpass123', role: 'teacher', isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [student._id, teacher._id] } });
  });

  const tokenFor = (user) => jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  it('rejects a student requesting admin-only business metrics', async () => {
    const res = await request(app).get('/api/admin/business-metrics').set('Authorization', `Bearer ${tokenFor(student)}`);
    expect(res.status).toBe(403);
  });

  it('rejects a teacher requesting admin-only business metrics (not just non-staff)', async () => {
    const res = await request(app).get('/api/admin/business-metrics').set('Authorization', `Bearer ${tokenFor(teacher)}`);
    expect(res.status).toBe(403);
  });

  it('rejects an unauthenticated request to an admin-only route with 401 before role is ever checked', async () => {
    const res = await request(app).get('/api/admin/business-metrics');
    expect(res.status).toBe(401);
  });
});
