import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import Progress from '../src/models/Progress.js';
import UserAchievement from '../src/models/UserAchievement.js';
import Badge from '../src/models/Badge.js';

// Regression coverage for Phase 19's achievement trigger-logic fix: checkAndAwardBadges used to
// only run inside dailyRewardController's claim handler, so a learner who crossed an XP
// threshold purely through exercise or lesson completion would see the badge marked "earned"
// live in the catalog (isBadgeUnlocked recomputes against current stats) but with no real
// UserAchievement record, no unlockedAt timestamp, and no unlock moment ever having fired.
// These tests submit real exercises/lessons (not synthetic DB writes) and confirm the actual
// persistence layer keeps up with the display layer at the exact moment a threshold is crossed.
describe('Achievement unlock triggers from real learning actions, not just daily-reward claims', () => {
  let instructor;
  let course;
  let lesson;
  let exercise;

  beforeAll(async () => {
    instructor = await User.create({
      firstName: 'Achievement', lastName: 'Instructor', email: 'achievement-instructor@example.com', password: 'testpass123', role: 'teacher', isEmailVerified: true,
    });
    course = await Course.create({
      title: 'Achievement Trigger Course', description: 'Fixture course.', language: 'English', level: 'Beginner', category: 'Grammar', instructor: instructor._id, cefr: 'A1',
    });
    lesson = await Lesson.create({ course: course._id, order: 1, title: 'Fixture Lesson', content: 'Real content.', cefr: 'A1' });
    exercise = await Exercise.create({
      lesson: lesson._id, title: 'Fixture Exercise', type: 'multiple_choice', question: 'Q', options: ['a', 'b'], correctAnswer: 0, skill: 'grammar', points: 10,
    });
  });

  afterAll(async () => {
    await Exercise.deleteOne({ _id: exercise._id });
    await Lesson.deleteOne({ _id: lesson._id });
    await Course.deleteOne({ _id: course._id });
    await User.deleteOne({ _id: instructor._id });
  });

  const signIn = async (email, password) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.token;
  };

  test('crossing the Rising Star (500 XP) threshold via exercise submission alone creates a real UserAchievement with unlockedAt', async () => {
    const student = await User.create({
      firstName: 'Exercise', lastName: 'Achiever', email: 'achievement-exercise@example.com', password: 'testpass123', role: 'student', isEmailVerified: true,
      xp: 495, // one 10-point correct answer crosses the 500 threshold
    });
    const token = await signIn('achievement-exercise@example.com', 'testpass123');

    const res = await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: exercise._id.toString(), answer: 0 });

    expect(res.status).toBe(200);
    expect(res.body.data.isCorrect).toBe(true);
    expect(res.body.data.unlockedBadges.some((b) => b.name === 'Rising Star')).toBe(true);

    const badge = await Badge.findOne({ name: 'Rising Star' });
    const record = await UserAchievement.findOne({ student: student._id, badge: badge._id });
    expect(record).not.toBeNull();
    expect(record.unlockedAt).toBeInstanceOf(Date);

    await User.deleteOne({ _id: student._id });
    await UserAchievement.deleteMany({ student: student._id });
  });

  test('crossing the Rising Star threshold via lesson completion alone creates a real UserAchievement', async () => {
    const student = await User.create({
      firstName: 'Lesson', lastName: 'Achiever', email: 'achievement-lesson@example.com', password: 'testpass123', role: 'student', isEmailVerified: true,
      xp: 460, // completeLesson awards a flat 50 XP, crossing the 500 threshold
    });
    await Progress.create({ user: student._id, course: course._id, completedLessons: [], progressPercentage: 0 });
    const token = await signIn('achievement-lesson@example.com', 'testpass123');

    const res = await request(app)
      .post('/api/progress/complete-lesson')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: course._id.toString(), lessonId: lesson._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.unlockedBadges.some((b) => b.name === 'Rising Star')).toBe(true);

    const badge = await Badge.findOne({ name: 'Rising Star' });
    const record = await UserAchievement.findOne({ student: student._id, badge: badge._id });
    expect(record).not.toBeNull();
    expect(record.unlockedAt).toBeInstanceOf(Date);

    await User.deleteOne({ _id: student._id });
    await Progress.deleteMany({ user: student._id });
    await UserAchievement.deleteMany({ student: student._id });
  });

  test('the achievements catalog reflects the same unlocked badge the trigger just recorded', async () => {
    const student = await User.create({
      firstName: 'Catalog', lastName: 'Achiever', email: 'achievement-catalog@example.com', password: 'testpass123', role: 'student', isEmailVerified: true,
      xp: 495,
    });
    const token = await signIn('achievement-catalog@example.com', 'testpass123');

    await request(app)
      .post('/api/exercises/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ exerciseId: exercise._id.toString(), answer: 0 });

    const catalogRes = await request(app).get('/api/users/achievements/catalog').set('Authorization', `Bearer ${token}`);
    expect(catalogRes.status).toBe(200);
    const risingStar = catalogRes.body.data.find((b) => b.name === 'Rising Star');
    expect(risingStar.earned).toBe(true);
    expect(risingStar.unlockedAt).not.toBeNull();

    await User.deleteOne({ _id: student._id });
    await UserAchievement.deleteMany({ student: student._id });
  });
});
