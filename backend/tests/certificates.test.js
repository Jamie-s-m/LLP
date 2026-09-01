import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Certificate from '../src/models/Certificate.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import Progress from '../src/models/Progress.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
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

  // Regression coverage for a release blocker, exercised through the real HTTP route (not a
  // reimplementation): one correct answer used to be enough for 'mastered', which fed straight
  // into level-readiness/certificate eligibility. This reproduces that exact path end to end
  // against the real seeded reference course and confirms no certificate is issued.
  it('cannot earn a certificate from a single correct answer in a single lesson', async () => {
    const gamer = await User.create({
      firstName: 'One',
      lastName: 'Gamer',
      email: 'cert-gamer@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    const gamerLogin = await request(app).post('/api/auth/login').send({ email: 'cert-gamer@example.com', password: 'testpass123' });
    const gamerToken = gamerLogin.body.token;

    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });
    const lessonA1 = lessons[0];
    const gradableExercise = await Exercise.findOne({ lesson: lessonA1._id, type: { $in: ['multiple_choice', 'fill_blank'] } });

    await Progress.create({ user: gamer._id, course: course._id, completedLessons: [lessonA1._id], progressPercentage: 33 });
    // Grind the same single exercise repeatedly, all correct - not "one attempt", to also
    // prove volume/duplicate submissions of one item can't substitute for real coverage.
    for (let i = 0; i < 10; i += 1) {
      await ExerciseAttempt.create({ user: gamer._id, exercise: gradableExercise._id, skill: gradableExercise.skill || 'grammar', isCorrect: true, status: 'graded' });
    }

    const masteryRes = await request(app)
      .get(`/api/certificates/mastery/${course._id}`)
      .set('Authorization', `Bearer ${gamerToken}`);
    expect(masteryRes.status).toBe(200);
    const lessonMastery = masteryRes.body.data.lessons.find((l) => l.lessonId === String(lessonA1._id));
    expect(lessonMastery.state).not.toBe('mastered');

    const checkRes = await request(app)
      .post(`/api/certificates/check-awards/${course._id}`)
      .set('Authorization', `Bearer ${gamerToken}`);
    expect(checkRes.status).toBe(200);

    const certificates = await Certificate.find({ user: gamer._id });
    expect(certificates).toHaveLength(0);

    await User.deleteOne({ _id: gamer._id });
    await Progress.deleteMany({ user: gamer._id });
    await ExerciseAttempt.deleteMany({ user: gamer._id });
  }, 30000);

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
