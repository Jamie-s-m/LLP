import mongoose from 'mongoose';
import { seedContent } from '../src/seed.js';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import Progress from '../src/models/Progress.js';
import ExerciseAttempt from '../src/models/ExerciseAttempt.js';
import { deriveMasteryState, computeLessonMastery, computeCourseMastery, isLevelReady } from '../src/utils/masteryEngine.js';
import { REFERENCE_COURSE } from '../src/data/referenceCurriculum.js';

describe('deriveMasteryState (pure function)', () => {
  const attempt = (isCorrect, exercise = 'ex1', status = 'graded', createdAt = new Date()) => ({ isCorrect, exercise, status, createdAt });

  it('is not_started with no completion and no attempts', () => {
    expect(deriveMasteryState({ lessonCompleted: false, attempts: [] })).toBe('not_started');
  });

  it('is introduced when attempts exist but the lesson is not completed', () => {
    expect(deriveMasteryState({ lessonCompleted: false, attempts: [attempt(true)] })).toBe('introduced');
  });

  it('is practicing when completed but no graded evidence yet', () => {
    expect(deriveMasteryState({ lessonCompleted: true, attempts: [attempt(false, 'ex1', 'pending_review')] })).toBe('practicing');
  });

  it('is developing at 50-74% accuracy', () => {
    const attempts = [attempt(true, 'ex1'), attempt(false, 'ex2')];
    expect(deriveMasteryState({ lessonCompleted: true, attempts })).toBe('developing');
  });

  it('is proficient at 75-89% accuracy with full exercise coverage', () => {
    const attempts = [attempt(true, 'ex1'), attempt(true, 'ex2'), attempt(true, 'ex3'), attempt(false, 'ex4')];
    expect(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 4 })).toBe('proficient');
  });

  it('cannot reach proficient (or mastered) from high accuracy with insufficient coverage - falls to developing instead', () => {
    // 100% accuracy, but only 1 of 3 real exercises ever attempted - the exact gap a
    // "proficient-tier" certificate exploit would use if only 'mastered' were gated.
    const attempts = [attempt(true, 'ex1')];
    const state = deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 3 });
    expect(state).not.toBe('proficient');
    expect(state).not.toBe('mastered');
    expect(state).toBe('developing');
  });

  it('is mastered at >=90% accuracy with all latest attempts correct AND full exercise coverage', () => {
    const attempts = [attempt(true, 'ex1'), attempt(true, 'ex2'), attempt(true, 'ex3')];
    expect(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 3 })).toBe('mastered');
  });

  it('is needs_review when historically strong but the latest attempt on a previously-correct exercise regresses', () => {
    const early = new Date('2026-01-01');
    const later = new Date('2026-01-02');
    const attempts = [
      attempt(true, 'ex1', 'graded', early),
      attempt(true, 'ex2', 'graded', early),
      attempt(true, 'ex3', 'graded', early),
      attempt(true, 'ex4', 'graded', early),
      attempt(true, 'ex5', 'graded', early),
      attempt(true, 'ex6', 'graded', early),
      attempt(true, 'ex7', 'graded', early),
      attempt(true, 'ex8', 'graded', early),
      attempt(true, 'ex9', 'graded', early),
      attempt(false, 'ex1', 'graded', later), // retried ex1 and got it wrong this time
    ];
    expect(deriveMasteryState({ lessonCompleted: true, attempts })).toBe('needs_review');
  });
});

// Regression coverage for a release blocker: `graded.length >= latestAttempts.length` (the
// old coverage check) is a mathematical tautology - a dedup of a list can never be longer than
// the list it came from - so it was always true and blocked nothing. One correct attempt on
// one exercise was enough for 'mastered', and repeatedly submitting one easy exercise could
// reach it too. Every case below is adversarial: it tries to reach 'mastered' or 'proficient'
// (both are certificate/level-readiness-eligible - see PROFICIENT_STATES) with too little or
// the wrong kind of evidence, and asserts it can't reach either. (An earlier version of this
// fix only gated 'mastered' - an end-to-end certificate test caught that 'proficient' was
// still an ungated, equally-eligible route to the same certificate; these tests check both on
// purpose.)
describe('deriveMasteryState - adversarial mastery-gaming regression coverage', () => {
  const attempt = (isCorrect, exercise = 'ex1', status = 'graded', createdAt = new Date()) => ({ isCorrect, exercise, status, createdAt });
  const repeat = (n, isCorrect, exercise, startAt = new Date('2026-01-01')) =>
    Array.from({ length: n }, (_, i) => attempt(isCorrect, exercise, 'graded', new Date(startAt.getTime() + i * 1000)));
  const notCertificateEligible = (state) => {
    expect(state).not.toBe('mastered');
    expect(state).not.toBe('proficient');
  };

  it('one correct answer cannot create mastery or proficiency, even on a 1-exercise lesson', () => {
    const attempts = [attempt(true, 'ex1')];
    notCertificateEligible(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 1 }));
  });

  it('two correct answers across the lesson\'s two distinct exercises is genuinely masterable', () => {
    const attempts = [attempt(true, 'ex1'), attempt(true, 'ex2')];
    expect(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 2 })).toBe('mastered');
  });

  it('one correct + one incorrect is not mastered', () => {
    const attempts = [attempt(true, 'ex1'), attempt(false, 'ex2')];
    const state = deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 2 });
    expect(state).not.toBe('mastered');
  });

  it('5 correct submissions of the SAME exercise cannot create mastery or proficiency on a multi-exercise lesson', () => {
    const attempts = repeat(5, true, 'ex1');
    notCertificateEligible(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 2 }));
  });

  it('10 correct submissions of the SAME exercise still cannot create mastery or proficiency', () => {
    const attempts = repeat(10, true, 'ex1');
    notCertificateEligible(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 2 }));
  });

  it('duplicate submissions of one exercise cannot bypass the minimum-distinct-evidence rule even mixed with a second exercise once', () => {
    // 9 duplicate submissions of ex1 (all correct) plus a single attempt at ex2 - overwhelming
    // raw volume and accuracy, but coverage is still only 2 of (say) 3 real exercises.
    const attempts = [...repeat(9, true, 'ex1'), attempt(true, 'ex2')];
    notCertificateEligible(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 3 }));
  });

  it('high accuracy with too little evidence (1 of 3 exercises attempted) is not certificate-eligible', () => {
    const attempts = [attempt(true, 'ex1')];
    notCertificateEligible(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 3 }));
  });

  it('large evidence with low accuracy is not mastered (and not needs_review)', () => {
    const attempts = [
      ...repeat(3, true, 'ex1'), ...repeat(7, false, 'ex1'),
      ...repeat(2, true, 'ex2'), ...repeat(8, false, 'ex2'),
    ];
    const state = deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 2 });
    expect(state).not.toBe('mastered');
    expect(state).not.toBe('needs_review');
  });

  it('old successes + a recent failure on full coverage flags needs_review, not mastered', () => {
    const early = new Date('2026-01-01');
    const later = new Date('2026-01-02');
    const attempts = [
      ...repeat(9, true, 'ex1', early).map((a, i) => ({ ...a, exercise: `ex${i + 1}` })),
      attempt(false, 'ex1', 'graded', later), // ex1 retried and now wrong
    ];
    expect(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 9 })).toBe('needs_review');
  });

  it('recent successes + a stale old failure never produces a false mastered (conservative, not gameable)', () => {
    const early = new Date('2026-01-01');
    const later = new Date('2026-01-02');
    // ex1 was wrong once, long ago, then corrected; ex2 was always correct. Latest-per-exercise
    // evidence is 100% correct, but raw historical accuracy (2/3) never crosses the 0.9 gate -
    // this is a known conservative characteristic (never a false positive; may under-classify
    // real improvement) and is safe from a gaming standpoint, which is what this test guards.
    const attempts = [
      attempt(false, 'ex1', 'graded', early),
      attempt(true, 'ex2', 'graded', early),
      attempt(true, 'ex1', 'graded', later),
    ];
    const state = deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 2 });
    expect(state).not.toBe('mastered');
  });

  it('duplicate submissions do not inflate latestAccuracy beyond what distinct evidence supports', () => {
    // ex1 submitted wrong 8 times then correct once (last), ex2 never attempted. Coverage is
    // only 1 of 2 exercises regardless of how many times ex1 was retried.
    const attempts = [...repeat(8, false, 'ex1'), attempt(true, 'ex1', 'graded', new Date('2026-02-01'))];
    expect(deriveMasteryState({ lessonCompleted: true, attempts, totalDistinctExercises: 2 })).not.toBe('mastered');
  });
});

describe('mastery engine against real seeded reference content', () => {
  let student;
  let course;
  let lessons;

  beforeAll(async () => {
    await seedContent({ mode: 'development', force: true, silent: true });
    course = await Course.findOne({ contentKey: REFERENCE_COURSE.id });
    lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });
    student = await User.create({
      firstName: 'Mastery',
      lastName: 'Tester',
      email: 'mastery-tester@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
  }, 60000);

  afterAll(async () => {
    await User.deleteOne({ _id: student._id });
    await Progress.deleteMany({ user: student._id });
    await ExerciseAttempt.deleteMany({ user: student._id });
  });

  it('reports not_started for a lesson the student has never touched', async () => {
    const mastery = await computeLessonMastery(student._id, lessons[0]._id);
    expect(mastery.state).toBe('not_started');
    expect(mastery.cefr).toBe('A1');
    expect(mastery.objectives.length).toBeGreaterThan(0);
  });

  it('separates completion from mastery: completing a lesson with wrong answers does not mean mastered', async () => {
    const lessonA1 = lessons[0];
    await Progress.create({ user: student._id, course: course._id, completedLessons: [lessonA1._id], progressPercentage: 33 });

    const exercises = await Exercise.find({ lesson: lessonA1._id, type: { $in: ['multiple_choice', 'fill_blank'] } });
    for (const exercise of exercises) {
      await ExerciseAttempt.create({ user: student._id, exercise: exercise._id, skill: exercise.skill || 'grammar', isCorrect: false, status: 'graded' });
    }

    const mastery = await computeLessonMastery(student._id, lessonA1._id);
    expect(mastery.completed).toBe(true);
    expect(['practicing', 'developing']).toContain(mastery.state);
    expect(mastery.state).not.toBe('mastered');

    const courseMastery = await computeCourseMastery(student._id, course._id);
    expect(courseMastery.completionPercentage).toBe(33);
    expect(courseMastery.masteryPercentage).toBeLessThan(100);
  });

  it('is not level-ready for A1 until A1 lessons show real mastery evidence', async () => {
    const readiness = await isLevelReady(student._id, course._id, 'A1');
    expect(readiness.ready).toBe(false);
  });

  it('becomes level-ready for A1 once the A1 lesson is genuinely mastered', async () => {
    const lessonA1 = lessons[0];
    await ExerciseAttempt.deleteMany({ user: student._id });

    const exercises = await Exercise.find({ lesson: lessonA1._id, type: { $in: ['multiple_choice', 'fill_blank'] } });
    for (const exercise of exercises) {
      await ExerciseAttempt.create({ user: student._id, exercise: exercise._id, skill: exercise.skill || 'grammar', isCorrect: true, status: 'graded' });
    }

    const readiness = await isLevelReady(student._id, course._id, 'A1');
    expect(readiness.ready).toBe(true);
    expect(readiness.reason).toBe('mastery_evidence_sufficient');
  });

  it('returns no_lessons_at_level for a CEFR level this course has no lessons for', async () => {
    const readiness = await isLevelReady(student._id, course._id, 'C1');
    expect(readiness.ready).toBe(false);
    expect(readiness.reason).toBe('no_lessons_at_level');
  });

  it('returns null for a non-existent lesson or course rather than throwing', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    expect(await computeLessonMastery(student._id, fakeId)).toBeNull();
    expect(await computeCourseMastery(student._id, fakeId)).toBeNull();
  });
});
