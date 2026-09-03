import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
import Flashcard from '../src/models/Flashcard.js';
import FlashcardProgress from '../src/models/FlashcardProgress.js';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role || 'student' }, process.env.JWT_SECRET || 'local-development-only-secret', { expiresIn: '1h' });

describe('Hearts + exercise attempts', () => {
  let token;
  let user;
  let exercise;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Hearts',
      lastName: 'Tester',
      email: 'hearts-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);

    const course = await Course.create({
      title: 'Test Course',
      description: 'Course for hearts test',
      language: 'English',
      level: 'Beginner',
      category: 'Conversation',
      instructor: user._id,
    });

    const lesson = await Lesson.create({
      course: course._id,
      order: 1,
      title: 'Test Lesson',
      description: 'Lesson for hearts test',
      content: 'content',
    });

    exercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Test Exercise',
      type: 'multiple_choice',
      question: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: '4',
      points: 20,
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await ExerciseAttempt.deleteMany({ user: user._id });
  });

  test('correct answer awards XP and does not cost a heart', async () => {
    const res = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: exercise._id.toString(), answer: '4' });

    expect(res.status).toBe(200);
    expect(res.body.data.isCorrect).toBe(true);
    expect(res.body.data.points).toBe(20);
    expect(res.body.data.hearts).toBe(5);
  });

  test('wrong answers deduct hearts down to zero, then block further attempts', async () => {
    let lastRes;
    for (let i = 0; i < 5; i += 1) {
      lastRes = await request(app)
        .post('/api/exercises/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({ exerciseId: exercise._id.toString(), answer: 'wrong' });
    }

    expect(lastRes.status).toBe(200);
    expect(lastRes.body.data.isCorrect).toBe(false);
    expect(lastRes.body.data.hearts).toBe(0);

    const blocked = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: exercise._id.toString(), answer: '4' });

    expect(blocked.status).toBe(403);
    expect(blocked.body.data.hearts).toBe(0);

    const heartsRes = await request(app)
      .get('/api/gamification/hearts')
      .set('Authorization', `Bearer ${token}`);

    expect(heartsRes.status).toBe(200);
    expect(heartsRes.body.data.hearts).toBe(0);
    expect(heartsRes.body.data.heartsRegenAt).not.toBeNull();
  });

  test('refilling hearts with coins requires enough coins', async () => {
    const res = await request(app)
      .post('/api/gamification/hearts/refill')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    await User.updateOne({ _id: user._id }, { $set: { linguaCoins: 100 } });

    const refilled = await request(app)
      .post('/api/gamification/hearts/refill')
      .set('Authorization', `Bearer ${token}`);

    expect(refilled.status).toBe(200);
    expect(refilled.body.data.hearts).toBe(5);
    expect(refilled.body.data.linguaCoins).toBe(50);
  });

  test('exercise attempts are logged for skills analytics', async () => {
    const attempts = await ExerciseAttempt.find({ user: user._id });
    expect(attempts.length).toBeGreaterThanOrEqual(6);
    expect(attempts.every((attempt) => attempt.skill === 'reading')).toBe(true);
  });
});

describe('Flashcard SM-2 review', () => {
  let token;
  let user;
  let card;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'Flash',
      lastName: 'Tester',
      email: 'flash-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);

    // cefr: 'A1' keeps this course's flashcards in the free tier - this describe block is
    // about SM-2 due-date scheduling, not paywall enforcement.
    const course = await Course.create({
      title: 'Flash Course',
      description: 'Course for flashcard test',
      language: 'English',
      level: 'Beginner',
      category: 'Conversation',
      instructor: user._id,
      cefr: 'A1',
    });

    card = await Flashcard.create({
      course: course._id,
      language: 'English',
      front: { text: 'Hello' },
      back: { text: 'Hola' },
      category: 'greetings',
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await FlashcardProgress.deleteMany({ student: user._id });
  });

  test('rejects an unknown rating', async () => {
    const res = await request(app)
      .post(`/api/flashcards/${card._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 'meh' });

    expect(res.status).toBe(400);
  });

  test('persists SM-2 progress across repeated "easy" reviews', async () => {
    const first = await request(app)
      .post(`/api/flashcards/${card._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 'easy' });

    expect(first.status).toBe(200);
    expect(first.body.data.interval).toBe(1);
    expect(first.body.data.repetitions).toBe(1);

    const second = await request(app)
      .post(`/api/flashcards/${card._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 'easy' });

    expect(second.status).toBe(200);
    expect(second.body.data.interval).toBe(6);
    expect(second.body.data.repetitions).toBe(2);

    const progress = await FlashcardProgress.findOne({ student: user._id, flashcard: card._id });
    expect(progress.easeFactor).toBeGreaterThan(2.5);
    expect(progress.deck).toBe('greetings');
  });

  test('GET /flashcards only returns cards actually due, not the whole deck', async () => {
    const notYetReviewed = await Flashcard.create({
      course: card.course,
      language: 'English',
      front: { text: 'Goodbye' },
      back: { text: 'Adiós' },
      category: 'greetings',
    });

    try {
      const res = await request(app)
        .get('/api/flashcards')
        .set('Authorization', `Bearer ${token}`)
        .query({ courseId: card.course.toString() });

      expect(res.status).toBe(200);
      const dueIds = res.body.data.map((item) => item._id);
      // "card" was just reviewed twice as "easy", landing its nextReviewDate 6 days out -
      // it must not reappear in the due list today.
      expect(dueIds).not.toContain(card._id.toString());
      // A card with no progress at all is always due (it's new).
      expect(dueIds).toContain(notYetReviewed._id.toString());
      expect(res.body.meta.totalCount).toBe(2);
      expect(res.body.meta.dueCount).toBe(1);
    } finally {
      await Flashcard.deleteOne({ _id: notYetReviewed._id });
    }
  });

  test('a low rating resets repetitions', async () => {
    const res = await request(app)
      .post(`/api/flashcards/${card._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 'again' });

    expect(res.status).toBe(200);
    expect(res.body.data.repetitions).toBe(0);
    expect(res.body.data.interval).toBe(1);
  });
});

describe('Flashcard review XP gating (regression: repeat-rating a not-yet-due card was an unlimited XP/coin farm)', () => {
  let token;
  let user;
  let card;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'FlashReplay',
      lastName: 'Tester',
      email: 'flash-replay-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
    token = signToken(user);

    const course = await Course.create({
      title: 'Flash Replay Course',
      description: 'Course for flashcard XP gating test',
      language: 'English',
      level: 'Beginner',
      category: 'Conversation',
      instructor: user._id,
      cefr: 'A1',
    });

    card = await Flashcard.create({
      course: course._id,
      language: 'English',
      front: { text: 'Good morning' },
      back: { text: 'Xayrli tong' },
      category: 'greetings',
    });
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
    await FlashcardProgress.deleteMany({ student: user._id });
  });

  test('the first review of a due card awards XP and coins', async () => {
    const res = await request(app)
      .post(`/api/flashcards/${card._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 'easy' });

    expect(res.status).toBe(200);
    expect(res.body.data.xpAwarded).toBe(5);
    expect(res.body.data.coinsAwarded).toBe(1);
    expect(res.body.data.totalXp).toBe(5);
    expect(res.body.data.totalLinguaCoins).toBe(1);
  });

  test('re-rating the same card before it is due again still updates SRS state but awards no further XP/coins', async () => {
    const res = await request(app)
      .post(`/api/flashcards/${card._id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 'easy' });

    expect(res.status).toBe(200);
    expect(res.body.data.xpAwarded).toBe(0);
    expect(res.body.data.coinsAwarded).toBe(0);
    // SRS state still advances (repetitions 1 -> 2) even though no reward was paid out -
    // reviewing ahead of schedule for genuine practice is not blocked, only the payout is.
    expect(res.body.data.repetitions).toBe(2);
    expect(res.body.data.totalXp).toBe(5);
    expect(res.body.data.totalLinguaCoins).toBe(1);

    const refreshed = await User.findById(user._id);
    expect(refreshed.xp).toBe(5);
    expect(refreshed.linguaCoins).toBe(1);
  });
});

describe('Heart-refill coin spend is atomic (regression: read-then-write allowed a double-spend race)', () => {
  let token;
  let user;

  beforeAll(async () => {
    user = await User.create({
      firstName: 'RefillRace',
      lastName: 'Tester',
      email: 'refill-race-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
      hearts: 2,
      linguaCoins: 50,
    });
    token = signToken(user);
  });

  afterAll(async () => {
    await User.deleteOne({ _id: user._id });
  });

  test('two concurrent refill requests with coins for exactly one refill: only one succeeds, coins never go negative', async () => {
    const [first, second] = await Promise.all([
      request(app).post('/api/gamification/hearts/refill').set('Authorization', `Bearer ${token}`),
      request(app).post('/api/gamification/hearts/refill').set('Authorization', `Bearer ${token}`),
    ]);

    const statuses = [first.status, second.status].sort();
    // Exactly one request wins the atomic update (200) and the other correctly sees
    // insufficient funds (400) - the old read-then-write code let both win, driving
    // linguaCoins negative and granting two refills for one refill's worth of coins.
    expect(statuses).toEqual([200, 400]);

    const refreshed = await User.findById(user._id);
    expect(refreshed.linguaCoins).toBe(0);
    expect(refreshed.hearts).toBe(5);
  });
});
