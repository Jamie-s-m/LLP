import { seedContent } from '../src/seed.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import { REFERENCE_COURSE } from '../src/data/referenceCurriculum.js';

describe('Reference curriculum seeding', () => {
  beforeAll(async () => {
    const result = await seedContent({ mode: 'development', force: true, silent: true });
    expect(result.seeded).toBe(true);
  }, 60000);

  it('creates the reference course with its lessons in CEFR order', async () => {
    const course = await Course.findOne({ contentKey: REFERENCE_COURSE.id });
    expect(course).not.toBeNull();
    expect(course.title).toBe(REFERENCE_COURSE.title);
    expect(course.totalLessons).toBe(3);

    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });
    expect(lessons.map((lesson) => lesson.cefr)).toEqual(['A1', 'A2', 'B1']);
  });

  it('persists explicit learning objectives with a skill tag on every reference lesson', async () => {
    const course = await Course.findOne({ contentKey: REFERENCE_COURSE.id });
    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });

    lessons.forEach((lesson) => {
      expect(lesson.objectives.length).toBeGreaterThan(0);
      lesson.objectives.forEach((objective) => {
        expect(typeof objective.description).toBe('string');
        expect(objective.description.length).toBeGreaterThan(10);
        expect(['grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing']).toContain(objective.skill);
      });
    });
  });

  it('seeds only working exercise types (multiple_choice, fill_blank, speaking) for the reference lessons', async () => {
    const course = await Course.findOne({ contentKey: REFERENCE_COURSE.id });
    const lessons = await Lesson.find({ course: course._id });
    const exercises = await Exercise.find({ lesson: { $in: lessons.map((l) => l._id) } });

    expect(exercises).toHaveLength(9); // 3 lessons x 3 exercises
    const types = new Set(exercises.map((exercise) => exercise.type));
    expect(types).toEqual(new Set(['multiple_choice', 'fill_blank', 'speaking']));
  });

  it('is idempotent - reseeding does not duplicate the reference course', async () => {
    await seedContent({ mode: 'development', force: true, silent: true });
    const courses = await Course.find({ contentKey: REFERENCE_COURSE.id });
    expect(courses).toHaveLength(1);
  }, 60000);
});
