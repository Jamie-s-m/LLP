import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Certificate from '../src/models/Certificate.js';
import Course from '../src/models/Course.js';
import { seedContent } from '../src/seed.js';
import { REFERENCE_COURSE } from '../src/data/referenceCurriculum.js';

describe('Certificate system', () => {
  let student;
  let admin;
  let adminToken;
  let course;

  beforeAll(async () => {
    await seedContent({ mode: 'development', force: true, silent: true });
    course = await Course.findOne({ contentKey: REFERENCE_COURSE.id });

    student = await User.create({
      firstName: 'Cert',
      lastName: 'Holder',
      email: 'cert-holder@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    admin = await User.create({
      firstName: 'Cert',
      lastName: 'Admin',
      email: 'cert-admin@example.com',
      password: 'testpass123',
      role: 'admin',
      isEmailVerified: true,
    });
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'cert-admin@example.com', password: 'testpass123' });
    adminToken = adminLogin.body.token;
  }, 60000);

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [student._id, admin._id] } });
    await Certificate.deleteMany({ user: student._id });
  });

  it('returns 404 for an unknown certificate id, revealing nothing about real ones', async () => {
    const res = await request(app).get('/api/certificates/verify/0000000000000000000000000000ff');
    expect(res.status).toBe(404);
  });

  it('issues a level_readiness certificate that never claims Cambridge or official CEFR certification', async () => {
    const certificate = await Certificate.create({
      user: student._id,
      achievementType: 'level_readiness',
      course: course._id,
      cefrLevel: 'A1',
      evidenceSnapshot: { lessonsEvaluated: 1, lessonsProficient: 1 },
    });

    const res = await request(app).get(`/api/certificates/verify/${certificate.certificateId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.learnerName).toBe('Cert Holder');
    expect(res.body.data.cefrLevel).toBe('A1');
    expect(res.body.data.issuer).toBe('LinguaNest');
    expect(res.body.data.status).toBe('active');

    const combinedText = `${res.body.data.methodology} ${res.body.data.limitations}`.toLowerCase();
    expect(combinedText).not.toContain('cambridge certified');
    expect(combinedText).not.toContain('official cambridge');
    expect(combinedText).not.toContain('officially certified');
  });

  it('does not expose the learner email on the public verification endpoint', async () => {
    const certificate = await Certificate.findOne({ user: student._id });
    const res = await request(app).get(`/api/certificates/verify/${certificate.certificateId}`);
    expect(JSON.stringify(res.body)).not.toContain('cert-holder@example.com');
  });

  it('lets an admin revoke a certificate, and a revoked certificate still verifies but shows revoked', async () => {
    const certificate = await Certificate.findOne({ user: student._id, status: 'active' });

    const revokeRes = await request(app)
      .patch(`/api/certificates/${certificate.certificateId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'test revocation' });
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.status).toBe('revoked');

    const verifyRes = await request(app).get(`/api/certificates/verify/${certificate.certificateId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('revoked');
  });

  it('requires authentication for mastery, check-awards, and mine endpoints', async () => {
    const [mastery, checkAwards, mine] = await Promise.all([
      request(app).get(`/api/certificates/mastery/${course._id}`),
      request(app).post(`/api/certificates/check-awards/${course._id}`),
      request(app).get('/api/certificates/mine'),
    ]);
    expect(mastery.status).toBe(401);
    expect(checkAwards.status).toBe(401);
    expect(mine.status).toBe(401);
  });

  it('rejects revocation from a non-admin', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'cert-holder@example.com', password: 'testpass123' });
    const certificate = await Certificate.findOne({ user: student._id });
    const res = await request(app)
      .patch(`/api/certificates/${certificate.certificateId}/revoke`)
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({ reason: 'should not work' });
    expect(res.status).toBe(403);
  });
});
