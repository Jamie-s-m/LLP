import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
import Flashcard from '../src/models/Flashcard.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

let studentCounter = 0;
const makeStudent = async (billing) => {
  studentCounter += 1;
  return User.create({
    firstName: 'Billing',
    lastName: `Tester${studentCounter}`,
    email: `billing-tester-${studentCounter}@example.com`,
    password: 'testpass123',
    role: 'student',
    isEmailVerified: true,
    ...(billing ? { billing } : {}),
  });
};

// Regression coverage for Phase 7: before this, no controller anywhere checked billing.status
// before granting content/exercise/flashcard access - a canceled subscriber had identical
// access to an active one. Free tier (confirmed with the founder): each course's A1-level
// content, plus Lesson 1 of every course regardless of level, stays free.
describe('Billing enforcement (paywall)', () => {
  let instructor;
  let course;
  let freeLessonByOrder; // order 1, cefr B1 - free ONLY because it's the course's first lesson
  let freeLessonByCefr; // order 2, cefr A1 - free because of its own level
  let gatedLesson; // order 3, cefr A2 - gated
  let freeExercise;
  let gatedExercise;

  beforeAll(async () => {
    instructor = await User.create({
      firstName: 'Billing',
      lastName: 'Instructor',
      email: 'billing-instructor@example.com',
      password: 'testpass123',
      role: 'teacher',
      isEmailVerified: true,
    });

    course = await Course.create({
      title: 'Billing Enforcement Course',
      description: 'Fixture course for paywall regression coverage.',
      language: 'English',
      level: 'Beginner',
      category: 'Grammar',
      instructor: instructor._id,
    });

    freeLessonByOrder = await Lesson.create({ course: course._id, order: 1, title: 'Free Lesson One', content: 'Real content for lesson one.', cefr: 'B1' });
    freeLessonByCefr = await Lesson.create({ course: course._id, order: 2, title: 'Free A1 Lesson', content: 'Real content for the A1 lesson.', cefr: 'A1' });
    gatedLesson = await Lesson.create({ course: course._id, order: 3, title: 'Gated Lesson', content: 'Real content behind the paywall.', cefr: 'A2' });
    course.lessons = [freeLessonByOrder._id, freeLessonByCefr._id, gatedLesson._id];
    await course.save();

    freeExercise = await Exercise.create({
      lesson: freeLessonByOrder._id, title: 'Free Exercise', type: 'multiple_choice', question: 'Q', options: ['a', 'b'], correctAnswer: 0, skill: 'grammar', points: 10,
    });
    gatedExercise = await Exercise.create({
      lesson: gatedLesson._id, title: 'Gated Exercise', type: 'multiple_choice', question: 'Q', options: ['a', 'b'], correctAnswer: 0, skill: 'grammar', points: 10,
    });
  });

  afterAll(async () => {
    await Exercise.deleteMany({ lesson: { $in: [freeLessonByOrder._id, freeLessonByCefr._id, gatedLesson._id] } });
    await Lesson.deleteMany({ course: course._id });
    await Course.deleteOne({ _id: course._id });
    await User.deleteOne({ _id: instructor._id });
  });

  describe('GET /api/lessons/:id', () => {
    it('serves full content for the free-by-order lesson to a student with no plan', async () => {
      const student = await makeStudent();
      const res = await request(app).get(`/api/lessons/${freeLessonByOrder._id}`).set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Real content for lesson one.');
      expect(res.body.meta?.locked).toBeUndefined();
      await User.deleteOne({ _id: student._id });
    });

    it('serves full content for the free-by-cefr (A1) lesson to a student with no plan', async () => {
      const student = await makeStudent();
      const res = await request(app).get(`/api/lessons/${freeLessonByCefr._id}`).set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Real content for the A1 lesson.');
      await User.deleteOne({ _id: student._id });
    });

    it('returns a locked shell (no content/vocabulary/grammar/exercises) for a gated lesson to a student with no plan', async () => {
      const student = await makeStudent();
      const res = await request(app).get(`/api/lessons/${gatedLesson._id}`).set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.locked).toBe(true);
      expect(res.body.data.title).toBe('Gated Lesson');
      expect(res.body.data.content).toBeUndefined();
      expect(res.body.data.vocabulary).toBeUndefined();
      expect(res.body.data.grammar).toBeUndefined();
      expect(res.body.data.exercises).toBeUndefined();
      await User.deleteOne({ _id: student._id });
    });

    it.each(['active', 'trialing'])('serves full content for the gated lesson to a %s-plan student', async (status) => {
      const student = await makeStudent({ plan: 'learner', status, provider: 'stripe' });
      const res = await request(app).get(`/api/lessons/${gatedLesson._id}`).set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Real content behind the paywall.');
      await User.deleteOne({ _id: student._id });
    });

    it.each(['past_due', 'canceled', 'unpaid', 'incomplete', 'inactive'])('keeps the gated lesson locked for a %s-status student', async (status) => {
      const student = await makeStudent({ plan: 'learner', status, provider: 'stripe' });
      const res = await request(app).get(`/api/lessons/${gatedLesson._id}`).set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.locked).toBe(true);
      await User.deleteOne({ _id: student._id });
    });

    it('lets the course-owning instructor see full content regardless of their own billing state', async () => {
      const res = await request(app).get(`/api/lessons/${gatedLesson._id}`).set('Authorization', `Bearer ${signToken(instructor)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Real content behind the paywall.');
    });
  });

  describe('POST /api/exercises/submit', () => {
    it('grades the free-tier exercise for a no-plan student', async () => {
      const student = await makeStudent();
      const res = await request(app)
        .post('/api/exercises/submit')
        .set('Authorization', `Bearer ${signToken(student)}`)
        .send({ exerciseId: freeExercise._id.toString(), answer: 0 });
      expect(res.status).toBe(200);
      await User.deleteOne({ _id: student._id });
    });

    it('returns 402 for a gated-lesson exercise from a no-plan student, without creating an attempt or touching hearts', async () => {
      const student = await makeStudent();
      const res = await request(app)
        .post('/api/exercises/submit')
        .set('Authorization', `Bearer ${signToken(student)}`)
        .send({ exerciseId: gatedExercise._id.toString(), answer: 0 });

      expect(res.status).toBe(402);
      expect(res.body.data.requiresUpgrade).toBe(true);

      const attempts = await ExerciseAttempt.find({ user: student._id });
      expect(attempts.length).toBe(0);
      const refreshed = await User.findById(student._id);
      expect(refreshed.hearts).toBe(student.hearts);
      await User.deleteOne({ _id: student._id });
    });

    it('grades the gated-lesson exercise for an active-plan student', async () => {
      const student = await makeStudent({ plan: 'learner', status: 'active', provider: 'stripe' });
      const res = await request(app)
        .post('/api/exercises/submit')
        .set('Authorization', `Bearer ${signToken(student)}`)
        .send({ exerciseId: gatedExercise._id.toString(), answer: 0 });
      expect(res.status).toBe(200);
      const attempts = await ExerciseAttempt.find({ user: student._id });
      expect(attempts.length).toBe(1);
      await User.deleteOne({ _id: student._id });
    });
  });

  describe('GET /api/flashcards', () => {
    let freeCourse;
    let gatedCourse;
    let freeCard;
    let gatedCard;

    beforeAll(async () => {
      freeCourse = await Course.create({
        title: 'Free A1 Flashcard Course', description: 'x', language: 'English', level: 'Beginner', category: 'Vocabulary', instructor: instructor._id, cefr: 'A1',
      });
      gatedCourse = await Course.create({
        title: 'Gated A2 Flashcard Course', description: 'x', language: 'English', level: 'Beginner', category: 'Vocabulary', instructor: instructor._id, cefr: 'A2',
      });
      freeCard = await Flashcard.create({ course: freeCourse._id, language: 'English', front: { text: 'hi' }, back: { text: 'salom' } });
      gatedCard = await Flashcard.create({ course: gatedCourse._id, language: 'English', front: { text: 'bye' }, back: { text: 'xayr' } });
    });

    afterAll(async () => {
      await Flashcard.deleteMany({ course: { $in: [freeCourse._id, gatedCourse._id] } });
      await Course.deleteMany({ _id: { $in: [freeCourse._id, gatedCourse._id] } });
    });

    it('only shows cards from free (A1) courses to a no-plan student browsing the unscoped deck', async () => {
      const student = await makeStudent();
      const res = await request(app).get('/api/flashcards').set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((card) => card._id);
      expect(ids).toContain(String(freeCard._id));
      expect(ids).not.toContain(String(gatedCard._id));
      await User.deleteOne({ _id: student._id });
    });

    it('returns 402 when a no-plan student requests a specific gated course\'s flashcards directly', async () => {
      const student = await makeStudent();
      const res = await request(app)
        .get('/api/flashcards')
        .query({ courseId: gatedCourse._id.toString() })
        .set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(402);
      await User.deleteOne({ _id: student._id });
    });

    it('serves a free course\'s flashcards to a no-plan student when requested directly', async () => {
      const student = await makeStudent();
      const res = await request(app)
        .get('/api/flashcards')
        .query({ courseId: freeCourse._id.toString() })
        .set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((card) => card._id);
      expect(ids).toContain(String(freeCard._id));
      await User.deleteOne({ _id: student._id });
    });

    it('shows flashcards from every course, gated or not, to an active-plan student', async () => {
      const student = await makeStudent({ plan: 'learner', status: 'active', provider: 'stripe' });
      const res = await request(app).get('/api/flashcards').set('Authorization', `Bearer ${signToken(student)}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((card) => card._id);
      expect(ids).toContain(String(gatedCard._id));
      await User.deleteOne({ _id: student._id });
    });
  });
});
