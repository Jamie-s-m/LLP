import { seedContent } from '../src/seed.js';
import { LINGUANEST_CONTENT_LIBRARY } from '../src/contentLibrary.js';
import Exercise from '../src/models/Exercise.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import GradingRemediation from '../src/models/GradingRemediation.js';
import {
  detectAffectedAttempts,
  applyGraceCredit,
  validateRemediation,
  rollbackRemediation,
} from '../scripts/migrations/mcGradingBug/lib.js';

// Exercises against the real seeded catalog and the real Exercise/ExerciseAttempt/User
// collections in the ephemeral test database - this is the actual domain boundary the real CLI
// scripts (detect.js/apply.js/validate.js/rollback.js) call into, not a reimplementation.
describe('multiple-choice grading bug migration (backend/scripts/migrations/mcGradingBug)', () => {
  const REASON = 'test-mc-grading-bug';
  const CUTOFF = new Date('2026-06-01T00:00:00Z');
  const BEFORE_CUTOFF = new Date('2026-05-01T00:00:00Z');
  const AFTER_CUTOFF = new Date('2026-07-01T00:00:00Z');

  let affectedExercise; // a real generator multiple_choice exercise
  let referenceExercise; // the hand-authored reference-curriculum multiple_choice exercise
  let adHocExercise; // a teacher-created exercise with no contentKey
  let userA;
  let userB;
  let teacher;

  beforeAll(async () => {
    await seedContent({ mode: 'development', force: true, silent: true });

    const generatorKey = LINGUANEST_CONTENT_LIBRARY.lessons
      .flatMap((lesson) => lesson.exercises || [])
      .find((exercise) => exercise.type === 'multiple_choice')?.id;
    affectedExercise = await Exercise.findOne({ type: 'multiple_choice', contentKey: generatorKey });
    expect(affectedExercise).not.toBeNull();

    referenceExercise = await Exercise.findOne({ type: 'multiple_choice', contentKey: { $regex: /^efw-ref-/ } });
    expect(referenceExercise).not.toBeNull();

    teacher = await User.findOne({ role: 'teacher' });
    const course = await Course.findOne({ instructor: teacher._id });
    const lesson = await Lesson.findOne({ course: course._id });
    adHocExercise = await Exercise.create({
      lesson: lesson._id,
      title: 'Teacher-made MC exercise',
      type: 'multiple_choice',
      question: 'Pick one',
      options: ['x', 'y'],
      correctAnswer: 0,
      skill: 'grammar',
      points: 10,
      // Deliberately no contentKey - matches how LessonEditor.tsx creates exercises.
    });

    userA = await User.create({
      firstName: 'Affected', lastName: 'Learner', email: 'mc-bug-user-a@example.com',
      password: 'testpass123', role: 'student', isEmailVerified: true,
    });
    userB = await User.create({
      firstName: 'Unaffected', lastName: 'Learner', email: 'mc-bug-user-b@example.com',
      password: 'testpass123', role: 'student', isEmailVerified: true,
    });

    const attempt = (overrides) => ExerciseAttempt.create({
      user: userA._id, exercise: affectedExercise._id, skill: 'grammar',
      isCorrect: false, status: 'graded', pointsAwarded: 0, ...overrides,
    });

    // 3 real affected attempts for userA.
    await attempt({ createdAt: BEFORE_CUTOFF });
    await attempt({ createdAt: BEFORE_CUTOFF });
    await attempt({ createdAt: BEFORE_CUTOFF });
    // Not affected: after the cutoff (graded under the fixed code).
    await attempt({ createdAt: AFTER_CUTOFF });
    // Not affected: correct, and a different user (userB) who should never appear.
    await attempt({ user: userB._id, isCorrect: true, pointsAwarded: 10, createdAt: BEFORE_CUTOFF });
    // Not affected: pending_review, not yet graded.
    await attempt({ status: 'pending_review', createdAt: BEFORE_CUTOFF });
    // Not affected: on the reference-curriculum exercise, not a generator one.
    await attempt({ exercise: referenceExercise._id, createdAt: BEFORE_CUTOFF });
    // Not affected: on a teacher-created exercise with no contentKey.
    await attempt({ exercise: adHocExercise._id, createdAt: BEFORE_CUTOFF });
  }, 60000);

  afterAll(async () => {
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
    await ExerciseAttempt.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Exercise.deleteOne({ _id: adHocExercise._id });
    await GradingRemediation.deleteMany({ reason: REASON });
  });

  it('detects exactly the affected attempts: right user, right exercise population, right time window', async () => {
    const report = await detectAffectedAttempts(CUTOFF);

    const userAEntry = report.perUser.find((entry) => entry.userId === String(userA._id));
    expect(userAEntry).toBeDefined();
    expect(userAEntry.affectedAttemptCount).toBe(3);
    expect(userAEntry.xpForegone).toBe(3 * affectedExercise.points);

    const userBEntry = report.perUser.find((entry) => entry.userId === String(userB._id));
    expect(userBEntry).toBeUndefined();
  });

  it('dry-run apply reports what would happen without writing anything', async () => {
    const before = await User.findById(userA._id).select('xp');

    const result = await applyGraceCredit({ cutoffDate: CUTOFF, reason: REASON, dryRun: true });

    const entry = result.results.find((r) => r.userId === String(userA._id));
    expect(entry.status).toBe('would_credit');

    const after = await User.findById(userA._id).select('xp');
    expect(after.xp).toBe(before.xp);
    expect(await GradingRemediation.findOne({ user: userA._id, reason: REASON })).toBeNull();
  });

  it('apply credits the exact foregone XP once, and is a no-op on a second run', async () => {
    const before = await User.findById(userA._id).select('xp');
    const expectedCredit = 3 * affectedExercise.points;

    const first = await applyGraceCredit({ cutoffDate: CUTOFF, reason: REASON, dryRun: false });
    const firstEntry = first.results.find((r) => r.userId === String(userA._id));
    expect(firstEntry.status).toBe('credited');

    const afterFirst = await User.findById(userA._id).select('xp');
    expect(afterFirst.xp).toBe(before.xp + expectedCredit);

    const record = await GradingRemediation.findOne({ user: userA._id, reason: REASON });
    expect(record).not.toBeNull();
    expect(record.xpCredited).toBe(expectedCredit);
    expect(record.affectedAttemptCount).toBe(3);

    // Re-running must not double-credit.
    const second = await applyGraceCredit({ cutoffDate: CUTOFF, reason: REASON, dryRun: false });
    const secondEntry = second.results.find((r) => r.userId === String(userA._id));
    expect(secondEntry.status).toBe('already_credited');

    const afterSecond = await User.findById(userA._id).select('xp');
    expect(afterSecond.xp).toBe(afterFirst.xp);
  });

  it('never touches ExerciseAttempt.isCorrect/pointsAwarded - history stays exactly as recorded', async () => {
    const attempts = await ExerciseAttempt.find({ user: userA._id, exercise: affectedExercise._id, createdAt: BEFORE_CUTOFF });
    attempts.forEach((attempt) => {
      expect(attempt.isCorrect).toBe(false);
      expect(attempt.pointsAwarded).toBe(0);
    });
  });

  it('validate confirms full remediation after apply', async () => {
    const result = await validateRemediation({ cutoffDate: CUTOFF, reason: REASON });
    expect(result.isFullyRemediated).toBe(true);
    expect(result.uncredited).toHaveLength(0);
  });

  it('rollback reverts the exact credited amount and is a no-op the second time', async () => {
    const beforeRollback = await User.findById(userA._id).select('xp');
    const record = await GradingRemediation.findOne({ user: userA._id, reason: REASON });

    const first = await rollbackRemediation({ reason: REASON, dryRun: false });
    expect(first.revertedCount).toBe(1);

    const afterRollback = await User.findById(userA._id).select('xp');
    expect(afterRollback.xp).toBe(beforeRollback.xp - record.xpCredited);

    const updatedRecord = await GradingRemediation.findById(record._id);
    expect(updatedRecord.revertedAt).not.toBeNull();

    const second = await rollbackRemediation({ reason: REASON, dryRun: false });
    expect(second.revertedCount).toBe(0);

    const afterSecondRollback = await User.findById(userA._id).select('xp');
    expect(afterSecondRollback.xp).toBe(afterRollback.xp);
  });
});
