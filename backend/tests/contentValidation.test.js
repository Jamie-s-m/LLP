import { buildLinguaNestContentLibrary } from '../src/contentLibrary.js'

const EXPECTED_STARTER_COURSE_IDS = [
  'general-english-a1',
  'general-english-a2',
  'general-english-b1',
  'general-english-b2',
  'business-english',
  'english-speaking',
  'english-for-kids',
]

describe('LinguaNest content library', () => {
  test('contains the required sample course set', () => {
    const library = buildLinguaNestContentLibrary()

    expect(library.courses).toHaveLength(7)
    expect(library.courses.map((course) => course.title)).toEqual([
      'General English A1',
      'General English A2',
      'General English B1',
      'General English B2',
      'Business English',
      'English Speaking',
      'English for Kids',
    ])
  })

  test('keeps the expected starter course ids stable and protected from regression', () => {
    const library = buildLinguaNestContentLibrary()
    const ids = library.courses.map((course) => course.contentKey || course.id)

    expect(ids).toHaveLength(EXPECTED_STARTER_COURSE_IDS.length)
    expect(ids).toEqual(expect.arrayContaining(EXPECTED_STARTER_COURSE_IDS))
    expect(new Set(ids).size).toBe(EXPECTED_STARTER_COURSE_IDS.length)
  })

  test('provides enough lessons and exercises for a genuine demo library', () => {
    const library = buildLinguaNestContentLibrary()

    expect(library.metadata.totalLessons).toBeGreaterThanOrEqual(150)
    expect(library.metadata.totalExercises).toBeGreaterThanOrEqual(450)
    expect(library.metadata.totalVocabulary).toBeGreaterThanOrEqual(500)
    expect(library.metadata.totalAssessmentQuestions).toBeGreaterThanOrEqual(240)
  })

  test('keeps every lesson structurally valid', () => {
    const library = buildLinguaNestContentLibrary()

    for (const lesson of library.lessons) {
      expect(lesson.title).toBeTruthy()
      expect(lesson.objective).toBeTruthy()
      expect(lesson.content).toBeTruthy()
      expect(lesson.exercises.length).toBeGreaterThanOrEqual(3)
    }
  })
})
