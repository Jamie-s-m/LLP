import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
import PlacementQuestion from '../src/models/PlacementQuestion.js';
import { placementQuestions } from '../src/data/placementQuestions.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Exercise answer-key visibility', () => {
  let teacherToken, studentToken, student, lesson, exercise;

  beforeAll(async () => {
    const teacher = await User.create({
      firstName: 'Answers',
      lastName: 'Teacher',
      email: 'answers-teacher@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    teacherToken = signToken(teacher);

    student = await User.create({
      firstName: 'Answers',
      lastName: 'Student',
      email: 'answers-student@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    studentToken = signToken(student);

    const course = await Course.create({
      title: 'Answers Course',
      description: 'Course for answer-visibility test',
      language: 'English',
      level: 'Beginner',
      category: 'Reading',
      instructor: teacher._id,
    });
    lesson = await Lesson.create({ course: course._id, order: 1, title: 'Answers Lesson', content: 'content' });
    exercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Answers Exercise',
      type: 'multiple_choice',
      question: 'Pick the right word',
      options: ['a', 'b'],
      correctAnswer: 'a',
      points: 10,
    });
    await Lesson.findByIdAndUpdate(lesson._id, { exercises: [exercise._id] });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: student._id });
  });

  test('a student cannot see the answer key via the exercise endpoints or the lesson populate', async () => {
    const byId = await request(app).get(`/api/exercises/${exercise._id}`).set('Authorization', `Bearer ${studentToken}`);
    expect(byId.body.data.correctAnswer).toBeUndefined();

    const list = await request(app).get('/api/exercises').query({ lessonId: lesson._id.toString() }).set('Authorization', `Bearer ${studentToken}`);
    expect(list.body.data[0].correctAnswer).toBeUndefined();

    const viaLesson = await request(app).get(`/api/lessons/${lesson._id}`).set('Authorization', `Bearer ${studentToken}`);
    expect(viaLesson.body.data.exercises[0].correctAnswer).toBeUndefined();
  });

  test('the owning teacher can see the answer key to edit it', async () => {
    const byId = await request(app).get(`/api/exercises/${exercise._id}`).set('Authorization', `Bearer ${teacherToken}`);
    expect(byId.body.data.correctAnswer).toBe('a');

    const viaLesson = await request(app).get(`/api/lessons/${lesson._id}`).set('Authorization', `Bearer ${teacherToken}`);
    expect(viaLesson.body.data.exercises[0].correctAnswer).toBe('a');
  });
});

describe('Fill-blank grading', () => {
  let token;
  let user;
  let exercise;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Fill',
      lastName: 'Tester',
      email: 'fill-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);

    const course = await Course.create({
      title: 'Fill Course',
      description: 'Course for fill-blank test',
      language: 'English',
      level: 'Beginner',
      category: 'Grammar',
      instructor: user._id,
    });
    const lesson = await Lesson.create({ course: course._id, order: 1, title: 'Fill Lesson', content: 'content' });
    exercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Fill Blank Exercise',
      type: 'fill_blank',
      question: 'I ___ to school every day.',
      sentenceTemplate: 'I ___ to school every day.',
      correctAnswers: ['go', 'Go'],
      points: 15,
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await ExerciseAttempt.deleteMany({ user: user._id });
  });

  test('accepts a case-insensitive, trimmed match', async () => {
    const res = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: exercise._id.toString(), answer: '  GO  ' });

    expect(res.status).toBe(200);
    expect(res.body.data.isCorrect).toBe(true);
    expect(res.body.data.points).toBe(15);
  });

  test('rejects a wrong answer', async () => {
    const res = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: exercise._id.toString(), answer: 'went' });

    expect(res.status).toBe(200);
    expect(res.body.data.isCorrect).toBe(false);
  });
});

describe('Speaking exercise manual-review queue', () => {
  let teacherToken, teacher, studentToken, student, exercise, course;

  beforeAll(async () => {
    teacher = await User.create({
      firstName: 'Speak',
      lastName: 'Teacher',
      email: 'speak-teacher@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    teacherToken = signToken(teacher);

    student = await User.create({
      firstName: 'Speak',
      lastName: 'Student',
      email: 'speak-student@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    studentToken = signToken(student);

    course = await Course.create({
      title: 'Speaking Course',
      description: 'Course for speaking test',
      language: 'English',
      level: 'Beginner',
      category: 'Conversation',
      instructor: teacher._id,
    });
    const lesson = await Lesson.create({ course: course._id, order: 1, title: 'Speaking Lesson', content: 'content' });
    exercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Speaking Exercise',
      type: 'speaking',
      question: 'Introduce yourself in one sentence.',
      points: 25,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [teacher._id, student._id] } });
    await ExerciseAttempt.deleteMany({ exercise: exercise._id });
  });

  test('submission is queued for review, not auto-graded, and does not touch hearts', async () => {
    const res = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ exerciseId: exercise._id.toString(), audioBase64: 'data:audio/webm;base64,ZmFrZS1hdWRpbw==' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending_review');

    const attempt = await ExerciseAttempt.findOne({ exercise: exercise._id, user: student._id });
    expect(attempt.status).toBe('pending_review');
    expect(attempt.pointsAwarded).toBe(0);

    const refreshedStudent = await User.findById(student._id);
    expect(refreshedStudent.hearts).toBe(5);
  });

  test('the owning teacher sees it in the review queue and can grade it', async () => {
    const queueRes = await request(app)
      .get('/api/exercises/reviews/speaking')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data.length).toBe(1);
    const attemptId = queueRes.body.data[0]._id;

    const reviewRes = await request(app)
      .post(`/api/exercises/reviews/speaking/${attemptId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ isCorrect: true, feedback: 'Great pronunciation!' });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('graded');
    expect(reviewRes.body.data.pointsAwarded).toBe(25);

    const gradedStudent = await User.findById(student._id);
    expect(gradedStudent.xp).toBe(25);
  });

  test('a teacher who does not own the course cannot see or grade it', async () => {
    const otherTeacher = await User.create({
      firstName: 'Other',
      lastName: 'Teacher',
      email: 'other-teacher@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });
    const otherToken = signToken(otherTeacher);

    const secondExercise = await Exercise.create({
      lesson: (await Lesson.create({ course: course._id, order: 2, title: 'Second Speaking Lesson', content: 'content' }))._id,
      title: 'Second Speaking Exercise',
      type: 'speaking',
      question: 'Describe your day.',
      points: 10,
    });
    await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ exerciseId: secondExercise._id.toString(), audioBase64: 'data:audio/webm;base64,ZmFrZQ==' });

    const queueRes = await request(app)
      .get('/api/exercises/reviews/speaking')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(queueRes.body.data.length).toBe(0);

    await User.deleteOne({ _id: otherTeacher._id });
  });
});

describe('Placement test', () => {
  let token;
  let user;

  beforeAll(async () => {
    await PlacementQuestion.deleteMany({});
    for (const question of placementQuestions) {
      await PlacementQuestion.create(question);
    }

    user = await User.create({
      firstName: 'Placement',
      lastName: 'Tester',
      email: 'placement-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await PlacementQuestion.deleteMany({});
  });

  test('lists questions without exposing the correct answer', async () => {
    const res = await request(app)
      .get('/api/placement/questions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(16);
    expect(res.body.data[0].correctAnswer).toBeUndefined();
  });

  test('a perfect score places the student at Advanced (B2) and saves it to their profile', async () => {
    const questions = await PlacementQuestion.find().sort({ order: 1 });
    const answers = questions.map((question) => ({ questionId: question._id.toString(), answer: question.correctAnswer }));

    const res = await request(app)
      .post('/api/placement/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.data.cefr).toBe('B2');
    expect(res.body.data.level).toBe('Advanced');
    expect(res.body.data.totalCorrect).toBe(16);

    const refreshed = await User.findById(user._id);
    expect(refreshed.placementLevel).toBe('Advanced');
    expect(refreshed.placementCompletedAt).not.toBeNull();
  });

  test('only passing the A1 tier places the student at Beginner', async () => {
    const questions = await PlacementQuestion.find().sort({ order: 1 });
    const answers = questions.map((question) => ({
      questionId: question._id.toString(),
      answer: question.cefr === 'A1' ? question.correctAnswer : (question.correctAnswer + 1) % question.options.length,
    }));

    const res = await request(app)
      .post('/api/placement/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.data.cefr).toBe('A1');
    expect(res.body.data.level).toBe('Beginner');
  });
});
