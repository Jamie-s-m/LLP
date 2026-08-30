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
    // Real, deduplicated vocabulary (baseVocabulary + topicClusters) - previously padded to
    // exactly 500 with fake "word-1".."word-300" filler entries; the real word list is smaller
    // but every entry is a genuine word with a genuine translation.
    expect(library.metadata.totalVocabulary).toBeGreaterThanOrEqual(300)
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

  test('never emits placeholder text in place of real content', () => {
    const library = buildLinguaNestContentLibrary()

    // Vocabulary: no "uz-123" style fake translations, no "word-123" filler words.
    // A tiny handful of words are genuine loanwords in Uzbek (e.g. "format", "signal"),
    // so uz === word is only suspicious when it isn't one of those.
    const LOANWORDS = new Set(['format', 'signal'])
    for (const item of library.vocabulary) {
      expect(item.word).not.toMatch(/^word-\d+$/)
      expect(item.uz).not.toMatch(/^uz-\d+$/)
      if (!LOANWORDS.has(item.word)) {
        expect(item.uz).not.toBe(item.word)
      }
    }

    // Every lesson's embedded vocabulary must have a real (non-identity) translation.
    for (const lesson of library.lessons) {
      for (const item of lesson.vocabulary) {
        expect(item.translation).not.toBe(item.word)
      }
    }

    // Quiz content must not contain the old generic placeholder options/answers.
    const PLACEHOLDER_STRINGS = ['A correct answer', 'A weaker choice', 'A distractor', 'Another distractor']
    for (const lesson of library.lessons) {
      for (const exercise of lesson.exercises) {
        for (const placeholder of PLACEHOLDER_STRINGS) {
          expect(exercise.options).not.toContain(placeholder)
          expect(exercise.correctAnswer).not.toBe(placeholder)
        }
      }
    }
  })
})
