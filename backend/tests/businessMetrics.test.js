import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Progress from '../src/models/Progress.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
import Exercise from '../src/models/Exercise.js';
import FlashcardProgress from '../src/models/FlashcardProgress.js';
import Flashcard from '../src/models/Flashcard.js';

describe('Business metrics API', () => {
  let adminToken;
  let studentToken;
  let course;
  let lesson;

  beforeAll(async () => {
    const admin = await User.create({
      firstName: 'Biz',
      lastName: 'Admin',
      email: 'biz-admin@example.com',
      password: 'testpass123',
      role: 'admin',
      isEmailVerified: true,
    });
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'biz-admin@example.com', password: 'testpass123' });
    adminToken = adminLogin.body.token;

    // A paying, activated, engaged student.
    const payingStudent = await User.create({
      firstName: 'Paying',
      lastName: 'Student',
      email: 'biz-paying@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
      onboardingCompletedAt: new Date(),
      placementCompletedAt: new Date(),
      streak: 5,
      billing: { plan: 'learner', status: 'active', provider: 'stripe' },
    });
    const studentLogin = await request(app).post('/api/auth/login').send({ email: 'biz-paying@example.com', password: 'testpass123' });
    studentToken = studentLogin.body.token;

    // A registered-but-not-activated student.
    await User.create({
      firstName: 'New',
      lastName: 'Student',
      email: 'biz-new@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });

    course = await Course.create({ title: 'Metrics Course', description: 'x', language: 'English', level: 'Beginner', category: 'Conversation', instructor: admin._id, isPublished: true });
    lesson = await Lesson.create({ title: 'Metrics Lesson', description: 'x', content: 'x', course: course._id, order: 1 });

    await Progress.create({ user: payingStudent._id, course: course._id, completedLessons: [lesson._id], progressPercentage: 50 });

    const exercise = await Exercise.create({ lesson: lesson._id, title: 'Metrics Exercise', type: 'multiple_choice', question: 'x', options: ['a', 'b'], correctAnswer: 'a', skill: 'grammar', points: 10 });
    await ExerciseAttempt.create({ user: payingStudent._id, exercise: exercise._id, skill: 'grammar', isCorrect: true, status: 'graded' });
    await ExerciseAttempt.create({ user: payingStudent._id, exercise: exercise._id, skill: 'grammar', isCorrect: false, status: 'graded' });

    const flashcard = await Flashcard.create({ language: 'English', front: { text: 'test' }, back: { text: 'sinov' }, category: 'general', difficulty: 'Easy' });
    await FlashcardProgress.create({ student: payingStudent._id, flashcard: flashcard._id, deck: 'test-deck', repetitions: 3 });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({ email: { $in: ['biz-admin@example.com', 'biz-paying@example.com', 'biz-new@example.com'] } }),
      Progress.deleteMany({ course: course._id }),
      Course.deleteOne({ _id: course._id }),
      Lesson.deleteOne({ _id: lesson._id }),
      ExerciseAttempt.deleteMany({}),
      Exercise.deleteMany({ lesson: lesson._id }),
      FlashcardProgress.deleteMany({}),
      Flashcard.deleteMany({ word: 'test' }),
    ]);
  });

  it('requires admin authorization', async () => {
    const res = await request(app).get('/api/admin/business-metrics').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/business-metrics');
    expect(res.status).toBe(401);
  });

  it('computes users, activation, monetization, and learning metrics from real data', async () => {
    const res = await request(app).get('/api/admin/business-metrics').set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { users, activation, monetization, learning, retention } = res.body.data;

    expect(users.registered).toBeGreaterThanOrEqual(2);
    expect(activation.onboardingCompletionRate).toBeGreaterThan(0);
    expect(monetization.payingUsers).toBeGreaterThanOrEqual(1);
    expect(monetization.payingByPlan.learner).toBeGreaterThanOrEqual(1);
    expect(monetization.mrrUsd).toBeGreaterThanOrEqual(19);
    expect(learning.lessonsCompleted).toBeGreaterThanOrEqual(1);
    expect(learning.exercisesCompleted).toBeGreaterThanOrEqual(2);
    expect(learning.averageAccuracyPercent).toBe(50);
    expect(learning.vocabularyReviews).toBeGreaterThanOrEqual(3);
    expect(retention._label).toBe('ESTIMATE');
    expect(typeof retention.methodology).toBe('string');
  });

  it('lists real paying users for founder outreach', async () => {
    const res = await request(app)
      .get('/api/admin/business-metrics/segment')
      .query({ segment: 'paying' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.segment).toBe('paying');
    expect(res.body.data.users.some((u) => u.email === 'biz-paying@example.com')).toBe(true);
  });

  it('rejects an unknown segment', async () => {
    const res = await request(app)
      .get('/api/admin/business-metrics/segment')
      .query({ segment: 'not-a-real-segment' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});
