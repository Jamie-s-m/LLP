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

  it('is proficient at 75-89% accuracy', () => {
    const attempts = [attempt(true, 'ex1'), attempt(true, 'ex2'), attempt(true, 'ex3'), attempt(false, 'ex4')];
    expect(deriveMasteryState({ lessonCompleted: true, attempts })).toBe('proficient');
  });

  it('is mastered at >=90% accuracy with all latest attempts correct', () => {
    const attempts = [attempt(true, 'ex1'), attempt(true, 'ex2'), attempt(true, 'ex3')];
    expect(deriveMasteryState({ lessonCompleted: true, attempts })).toBe('mastered');
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
