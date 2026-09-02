import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import Flashcard from '../src/models/Flashcard.js';
import Certificate from '../src/models/Certificate.js';
import { seedContent } from '../src/seed.js';
import { REFERENCE_COURSE } from '../src/data/referenceCurriculum.js';

// PRIORITY 24: one real new-user journey exercising every layer built this phase, in order:
// signup -> onboarding -> placement -> CEFR-referenced profile -> enrollment -> lesson ->
// quiz -> vocabulary -> speaking -> mastery -> progression -> certificate eligibility ->
// public certificate verification. Everything in this test hits real routes and real
// MongoDB queries - nothing is mocked.
//
// Deliberately NOT included, and why: a listening step (no real audio pipeline exists yet -
// see referenceCurriculum.js's header comment) and a writing step (no writing exercise UI
// exists - same reference). Faking either here would make this test lie about what the
// product can actually do.
describe('Acceptance: new-user journey through the CEFR curriculum architecture', () => {
  const email = 'acceptance-journey@example.com';
  const password = 'testpass123';
  let token;
  let userId;
  let referenceCourse;
  let a1Lesson;

  beforeAll(async () => {
    await seedContent({ mode: 'development', force: true, silent: true });
    referenceCourse = await Course.findOne({ contentKey: REFERENCE_COURSE.id });
    a1Lesson = await Lesson.findOne({ course: referenceCourse._id, cefr: 'A1' });
  }, 60000);

  afterAll(async () => {
    if (userId) {
      await Promise.all([
        User.deleteOne({ _id: userId }),
        Certificate.deleteMany({ user: userId }),
      ]);
    }
  });

  it('1. signs up', async () => {
    const res = await request(app).post('/api/auth/register').send({
      firstName: 'Acceptance',
      lastName: 'Journey',
      email,
      password,
      role: 'student',
    });
    expect(res.status).toBe(201);

    // Verification email delivery is out of scope here (covered by emailTimeout.test.js) -
    // flip the flag directly, the same shortcut every other test in this suite uses.
    const user = await User.findOneAndUpdate({ email }, { isEmailVerified: true }, { new: true });
    userId = user._id;

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    token = loginRes.body.token;
  });

  it('2. completes onboarding', async () => {
    const res = await request(app)
      .put('/api/users/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ learningGoal: 'job', selfAssessedLevel: 'beginner', dailyGoalMinutes: 15 });

    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompletedAt).not.toBeNull();
  });

  it('3. takes the placement test and receives a CEFR-referenced profile', async () => {
    const questionsRes = await request(app).get('/api/placement/questions').set('Authorization', `Bearer ${token}`);
    expect(questionsRes.status).toBe(200);
    expect(questionsRes.body.data.length).toBeGreaterThan(0);

    // Answer only the A1 questions correctly (deliberately imperfect elsewhere) so this
    // learner lands at a real, low CEFR tier rather than a maxed-out one - matching what the
    // rest of the journey (an A1 reference lesson) expects.
    const { placementQuestions } = await import('../src/data/placementQuestions.js');
    const byId = new Map(questionsRes.body.data.map((q, i) => [q._id, placementQuestions[i]]));
    const answers = questionsRes.body.data.map((q) => ({
      questionId: q._id,
      answer: byId.get(q._id)?.cefr === 'A1' ? byId.get(q._id).correctAnswer : 0,
    }));

    const submitRes = await request(app)
      .post('/api/placement/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers });

    expect(submitRes.status).toBe(200);
    expect(['A1', 'A2', 'B1', 'B2']).toContain(submitRes.body.data.cefr);
    expect(submitRes.body.data.recommendedCourses).toBeDefined();

    const profileRes = await request(app).get('/api/progress/skill-profile').set('Authorization', `Bearer ${token}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.overallCefr).toBeDefined();
    expect(profileRes.body.data.confidence).toBe('low');
    expect(profileRes.body.data.skills.find((s) => s.skill === 'grammar').placement.questionCount).toBeGreaterThan(0);
  });

  it('4. enrolls in the reference course', async () => {
    const res = await request(app)
      .post(`/api/progress/enroll/${referenceCourse._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
  });

  it('5. completes the A1 lesson', async () => {
    const res = await request(app)
      .post('/api/progress/complete-lesson')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: referenceCourse._id, lessonId: a1Lesson._id });
    expect(res.status).toBe(200);
  });

  it('6. answers the quiz exercises correctly', async () => {
    const mc = await Exercise.findOne({ lesson: a1Lesson._id, type: 'multiple_choice' });
    const fillBlank = await Exercise.findOne({ lesson: a1Lesson._id, type: 'fill_blank' });

    // multiple_choice is graded by option index (the real frontend sends the selected
    // option's array index, not its text - see contentLibrary.js's createExercise comment).
    const mcRes = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: mc._id, answer: mc.correctAnswer });
    expect(mcRes.status).toBe(200);
    expect(mcRes.body.data.isCorrect).toBe(true);

    const fbRes = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: fillBlank._id, answer: fillBlank.correctAnswer });
    expect(fbRes.status).toBe(200);
    expect(fbRes.body.data.isCorrect).toBe(true);
  });

  it('7. reviews a vocabulary flashcard', async () => {
    const listRes = await request(app).get('/api/flashcards').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    const card = listRes.body.data[0] || (await Flashcard.findOne());
    expect(card).toBeTruthy();

    const reviewRes = await request(app)
      .post(`/api/flashcards/${card._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 'good' });
    expect(reviewRes.status).toBe(200);
  });

  it('8. submits a speaking exercise for teacher review', async () => {
    const speaking = await Exercise.findOne({ lesson: a1Lesson._id, type: 'speaking' });
    const res = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: speaking._id, audioBase64: 'data:audio/webm;base64,ZmFrZS1hdWRpby1mb3ItdGVzdA==' });
    expect(res.status).toBe(200);
  });

  it('9. shows real mastery evidence, separate from raw completion', async () => {
    const res = await request(app)
      .get(`/api/certificates/mastery/${referenceCourse._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.completionPercentage).toBeGreaterThan(0);
    const a1LessonMastery = res.body.data.lessons.find((l) => l.lessonId === String(a1Lesson._id));
    expect(a1LessonMastery.state).toBe('mastered');
    expect(res.body.data.levelReadiness.A1.ready).toBe(true);
    expect(Array.isArray(res.body.data.skills)).toBe(true);
    expect(res.body.data.skills.some((s) => s.attemptCount > 0)).toBe(true);
  });

  it('10. becomes eligible for and receives a level_readiness certificate', async () => {
    const res = await request(app)
      .post(`/api/certificates/check-awards/${referenceCourse._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.levelResults.A1.awarded).toBe(true);
    expect(res.body.data.newCertificates.length).toBeGreaterThan(0);

    const mineRes = await request(app).get('/api/certificates/mine').set('Authorization', `Bearer ${token}`);
    expect(mineRes.status).toBe(200);
    expect(mineRes.body.data.some((c) => c.cefrLevel === 'A1' && c.achievementType === 'level_readiness')).toBe(true);
  });

  it('11. the issued certificate verifies publicly, with no login required', async () => {
    const mineRes = await request(app).get('/api/certificates/mine').set('Authorization', `Bearer ${token}`);
    const cert = mineRes.body.data.find((c) => c.cefrLevel === 'A1');

    const verifyRes = await request(app).get(`/api/certificates/verify/${cert.certificateId}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.learnerName).toBe('Acceptance Journey');
    expect(verifyRes.body.data.status).toBe('active');
    expect(verifyRes.body.data.methodology.toLowerCase()).not.toContain('official cefr certification');
  });
});
