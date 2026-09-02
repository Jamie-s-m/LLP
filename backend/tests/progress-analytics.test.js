import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
import Progress from '../src/models/Progress.js';
import Flashcard from '../src/models/Flashcard.js';

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

describe('Today recommendation', () => {
  let token;
  let user;
  let course;
  let lesson1;
  let lesson2;
  let grammarExercise;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Today',
      lastName: 'Tester',
      email: 'today-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);

    course = await Course.create({
      title: 'Today Course',
      description: 'Course for the today-recommendation test',
      language: 'English',
      level: 'Beginner',
      category: 'Grammar',
      instructor: user._id,
    });

    lesson1 = await Lesson.create({ course: course._id, order: 1, title: 'Lesson One', content: 'content', cefr: 'A1' });
    lesson2 = await Lesson.create({ course: course._id, order: 2, title: 'Lesson Two', content: 'content', cefr: 'A1' });

    grammarExercise = await Exercise.create({
      lesson: lesson1._id,
      title: 'Grammar Ex',
      type: 'multiple_choice',
      question: 'Pick the right word',
      options: ['a', 'b'],
      correctAnswer: 0,
      skill: 'grammar',
      points: 10,
    });
    // A vocabulary exercise the student never touches - lesson2 stays the skill gap.
    await Exercise.create({
      lesson: lesson2._id,
      title: 'Vocab Ex',
      type: 'multiple_choice',
      question: 'Pick the right word',
      options: ['a', 'b'],
      correctAnswer: 0,
      skill: 'vocabulary',
      points: 10,
    });

    course.lessons = [lesson1._id, lesson2._id];
    await course.save();

    await Progress.create({
      user: user._id,
      course: course._id,
      completedLessons: [lesson1._id],
      progressPercentage: 50,
      lastAccessedAt: new Date(),
    });

    await Flashcard.create([
      { course: course._id, language: 'English', front: { text: 'hello' }, back: { text: 'salom' } },
      { course: course._id, language: 'English', front: { text: 'world' }, back: { text: 'dunyo' } },
    ]);

    await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: grammarExercise._id.toString(), answer: 0 });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await Progress.deleteMany({ user: user._id });
    await ExerciseAttempt.deleteMany({ user: user._id });
    await Flashcard.deleteMany({ course: course._id });
    await Exercise.deleteMany({ lesson: { $in: [lesson1._id, lesson2._id] } });
    await Lesson.deleteMany({ course: course._id });
    await Course.deleteOne({ _id: course._id });
  });

  test('recommends continuing the next uncompleted lesson, the weakest untouched skill, and the overdue flashcard count', async () => {
    const res = await request(app)
      .get('/api/progress/today')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.continueLesson.lessonId).toBe(String(lesson2._id));
    expect(res.body.data.continueLesson.courseId).toBe(String(course._id));

    expect(res.body.data.weakestSkill.skill).toBe('vocabulary');
    expect(res.body.data.weakestSkill.state).toBe('not_started');

    expect(res.body.data.overdueFlashcardCount).toBe(2);
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
