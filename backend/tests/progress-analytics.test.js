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

describe('Weekly activity', () => {
  let token;
  let user;
  let exercise;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Weekly',
      lastName: 'Tester',
      email: 'weekly-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);

    const course = await Course.create({
      title: 'Weekly Activity Course',
      description: 'Course for the weekly-activity test',
      language: 'English',
      level: 'Beginner',
      category: 'Reading',
      instructor: user._id,
    });
    const lesson = await Lesson.create({ course: course._id, order: 1, title: 'Weekly Lesson', content: 'content' });
    exercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Weekly Exercise',
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

  test('returns exactly 7 zero-filled days with today reflecting a real attempt', async () => {
    await request(app).post('/api/exercises/submit').set('Authorization', `Bearer ${token}`).send({ exerciseId: exercise._id.toString(), answer: 'a' });
    await request(app).post('/api/exercises/submit').set('Authorization', `Bearer ${token}`).send({ exerciseId: exercise._id.toString(), answer: 'b' });

    const res = await request(app)
      .get('/api/progress/weekly-activity')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(7);

    const todayKey = new Date().toISOString().slice(0, 10);
    const today = res.body.data.find((day) => day.date === todayKey);
    expect(today.count).toBe(2);

    // Every earlier day in the window is real zero-fill, not omitted.
    expect(res.body.data.every((day) => typeof day.count === 'number')).toBe(true);
    expect(res.body.data[6].date).toBe(todayKey);
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
      // Keeps this course's flashcards in the free tier - this test is about the
      // today-recommendation logic, not paywall enforcement.
      cefr: 'A1',
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

describe('Class analytics', () => {
  let ownerToken;
  let owner;
  let otherTeacher;
  let otherTeacherToken;
  let adminToken;
  let admin;
  let course;
  let lesson;
  let exercise;
  let studentA;
  let studentB;

  beforeAll(async () => {
    owner = await User.create({
      firstName: 'Class', lastName: 'Owner', email: 'class-owner@example.com', password: 'testpass123', role: 'teacher', isEmailVerified: true,
    });
    ownerToken = signToken(owner);

    otherTeacher = await User.create({
      firstName: 'Other', lastName: 'Teacher', email: 'class-other-teacher@example.com', password: 'testpass123', role: 'teacher', isEmailVerified: true,
    });
    otherTeacherToken = signToken(otherTeacher);

    admin = await User.create({
      firstName: 'Class', lastName: 'Admin', email: 'class-admin@example.com', password: 'testpass123', role: 'admin', isEmailVerified: true,
    });
    adminToken = signToken(admin);

    course = await Course.create({
      title: 'Class Analytics Course', description: 'Fixture course', language: 'English', level: 'Beginner', category: 'Grammar', instructor: owner._id,
    });
    lesson = await Lesson.create({ course: course._id, order: 1, title: 'Class Lesson', content: 'content', cefr: 'A1' });
    exercise = await Exercise.create({
      lesson: lesson._id, title: 'Class Exercise', type: 'multiple_choice', question: 'Q', options: ['a', 'b'], correctAnswer: 0, skill: 'grammar', points: 10,
    });
    course.lessons = [lesson._id];
    await course.save();

    studentA = await User.create({
      firstName: 'Class', lastName: 'StudentA', email: 'class-student-a@example.com', password: 'testpass123', role: 'student', isEmailVerified: true,
    });
    studentB = await User.create({
      firstName: 'Class', lastName: 'StudentB', email: 'class-student-b@example.com', password: 'testpass123', role: 'student', isEmailVerified: true,
    });

    await Progress.create({ user: studentA._id, course: course._id, completedLessons: [lesson._id], progressPercentage: 100, isCompleted: true });
    await Progress.create({ user: studentB._id, course: course._id, completedLessons: [], progressPercentage: 0, isCompleted: false });
    await ExerciseAttempt.create({ user: studentA._id, exercise: exercise._id, skill: 'grammar', isCorrect: true, status: 'graded' });
  });

  afterAll(async () => {
    await ExerciseAttempt.deleteMany({ exercise: exercise._id });
    await Progress.deleteMany({ course: course._id });
    await Exercise.deleteMany({ lesson: lesson._id });
    await Lesson.deleteOne({ _id: lesson._id });
    await Course.deleteOne({ _id: course._id });
    await User.deleteMany({ _id: { $in: [owner._id, otherTeacher._id, admin._id, studentA._id, studentB._id] } });
  });

  test('the owning teacher sees every enrolled student with completion and per-skill mastery', async () => {
    const res = await request(app)
      .get(`/api/progress/class-analytics/${course._id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.studentCount).toBe(2);
    expect(res.body.data.classAverageCompletion).toBe(50);

    const studentARow = res.body.data.students.find((row) => row.studentId === String(studentA._id));
    expect(studentARow.completionPercentage).toBe(100);
    expect(studentARow.isCompleted).toBe(true);
    const grammarMastery = studentARow.skillMastery.find((row) => row.skill === 'grammar');
    expect(grammarMastery.attemptCount).toBe(1);

    const studentBRow = res.body.data.students.find((row) => row.studentId === String(studentB._id));
    expect(studentBRow.completionPercentage).toBe(0);
  });

  test('a teacher who does not own the course is rejected', async () => {
    const res = await request(app)
      .get(`/api/progress/class-analytics/${course._id}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`);
    expect(res.status).toBe(403);
  });

  test('an admin can see any course\'s class analytics', async () => {
    const res = await request(app)
      .get(`/api/progress/class-analytics/${course._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.studentCount).toBe(2);
  });

  test('a student cannot access class analytics at all', async () => {
    const studentToken = signToken(studentA);
    const res = await request(app)
      .get(`/api/progress/class-analytics/${course._id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
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
