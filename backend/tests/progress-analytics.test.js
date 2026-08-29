import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Achievements catalog', () => {
  let token;
  let user;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Badge',
      lastName: 'Tester',
      email: 'badge-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
      xp: 600,
      dailyRewardStreak: 2,
      totalLinguaCoinsEarned: 40,
    });
    token = signToken(user);
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
  });

  test('lists every catalog badge with earned/locked state and progress', async () => {
    const res = await request(app)
      .get('/api/users/achievements/catalog')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(5);

    const risingStar = res.body.data.find((badge) => badge.name === 'Rising Star');
    expect(risingStar.earned).toBe(true);
    expect(risingStar.progress).toBe(100);

    const languageLearner = res.body.data.find((badge) => badge.name === 'Language Learner');
    expect(languageLearner.earned).toBe(false);
    expect(languageLearner.progress).toBe(30); // 600/2000 XP

    const monthMaster = res.body.data.find((badge) => badge.name === 'Month Master');
    expect(monthMaster.earned).toBe(false);
    expect(monthMaster.progress).toBeGreaterThan(0);
  });
});

describe('Skills breakdown', () => {
  let token;
  let user;
  let exercise;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Skills',
      lastName: 'Tester',
      email: 'skills-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);

    const course = await Course.create({
      title: 'Skills Course',
      description: 'Course for skills test',
      language: 'English',
      level: 'Beginner',
      category: 'Reading',
      instructor: user._id,
    });

    const lesson = await Lesson.create({
      course: course._id,
      order: 1,
      title: 'Skills Lesson',
      description: 'Lesson for skills test',
      content: 'content',
    });

    exercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Reading Exercise',
      type: 'multiple_choice',
      question: 'Pick the right word',
      options: ['a', 'b'],
      correctAnswer: 'a',
      points: 10,
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
  });

  test('aggregates attempts by skill with accuracy', async () => {
    await request(app).post('/api/exercises/submit').set('Authorization', `Bearer ${token}`).send({ exerciseId: exercise._id.toString(), answer: 'a' });
    await request(app).post('/api/exercises/submit').set('Authorization', `Bearer ${token}`).send({ exerciseId: exercise._id.toString(), answer: 'b' });

    const res = await request(app)
      .get('/api/progress/skills-breakdown')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const reading = res.body.data.find((row) => row.skill === 'reading');
    expect(reading.attempts).toBe(2);
    expect(reading.correct).toBe(1);
    expect(reading.accuracy).toBe(50);

    const listening = res.body.data.find((row) => row.skill === 'listening');
    expect(listening.attempts).toBe(0);
    expect(listening.accuracy).toBe(0);
  });
});

describe('Daily reward history', () => {
  let token;
  let user;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'History',
      lastName: 'Tester',
      email: 'history-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
  });

  test('claim is readable back from history', async () => {
    const claimRes = await request(app)
      .post('/api/daily-reward/claim')
      .set('Authorization', `Bearer ${token}`);
    expect(claimRes.status).toBe(200);

    const historyRes = await request(app)
      .get('/api/daily-reward/history')
      .set('Authorization', `Bearer ${token}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].streak).toBe(1);
  });
});
