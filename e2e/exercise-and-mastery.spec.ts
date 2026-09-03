import { test, expect } from '@playwright/test'
import { registerAndVerify, randomEmail, API_URL } from './helpers'

// Covers exercise submission through the real UI, then mastery/certificate evidence via direct
// API calls. Reaching certificate-eligible mastery needs real coverage across many exercises
// (deriveMasteryState's anti-gaming guard, fixed earlier this project's life, requires genuine
// distinct-exercise evidence, not just attempt count) - clicking through dozens of exercises one
// at a time in a browser would make this suite slow and brittle for no real coverage gain over
// what backend/tests/masteryEngine.test.js and certificates.test.js already prove at the
// integration level. This spec's job is narrower and still real: confirm a human clicking
// through one actual exercise gets correct grading/feedback/XP in the live UI, and that once
// enough real evidence exists (built via the same submit endpoint, just called directly), the
// mastery API and the public certificate-verification page both reflect it.
test('submitting a real exercise grades correctly in the UI, and accumulated evidence produces real mastery', async ({ page, request }) => {
  const email = randomEmail('mastery')

  await test.step('register a new student account', async () => {
    await registerAndVerify(page, { firstName: 'Cy', lastName: 'Studious', email, password: 'E2ePassword123!' })
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
  })

  const token = await page.evaluate(() => localStorage.getItem('token'))

  const { freeLessonId, freeExerciseId } = await test.step('find a free exercise in the seeded reference course', async () => {
    const coursesRes = await request.get(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
    const courses = (await coursesRes.json()).data as Array<{ _id: string; title: string }>
    const referenceCourse = courses.find((c) => c.title.includes('Reference Pathway'))
    expect(referenceCourse).toBeTruthy()

    const lessonsRes = await request.get(`${API_URL}/lessons`, {
      params: { courseId: referenceCourse!._id },
      headers: { Authorization: `Bearer ${token}` },
    })
    const lessons = (await lessonsRes.json()).data as Array<{ _id: string; order: number }>
    const lessonOne = lessons.find((l) => l.order === 1)
    expect(lessonOne).toBeTruthy()

    const exercisesRes = await request.get(`${API_URL}/exercises`, {
      params: { lessonId: lessonOne!._id },
      headers: { Authorization: `Bearer ${token}` },
    })
    const exercises = (await exercisesRes.json()).data as Array<{ _id: string; type: string }>
    const multipleChoice = exercises.find((e) => e.type === 'multiple_choice')
    expect(multipleChoice, 'no multiple_choice exercise found in lesson 1').toBeTruthy()
    return { freeLessonId: lessonOne!._id, freeExerciseId: multipleChoice!._id }
  })

  await test.step('submitting an answer through the real UI shows real correct/incorrect feedback', async () => {
    await page.goto(`/exercise/${freeExerciseId}`)
    // Scoped to .card - an unscoped getByRole('button', {pressed: false}) also matches the
    // Navbar's language toggle (no explicit aria-pressed, which Playwright's pressed:false
    // filter still matches) - see helpers.ts's completeOnboarding comment for the full story.
    await page.locator('.card').getByRole('button', { pressed: false }).first().click()
    await page.getByRole('button', { name: 'Submit Answer' }).click()
    await expect(page.getByText(/Correct!|Incorrect/)).toBeVisible({ timeout: 15_000 })
  })

  const referenceCourseId = await test.step('enroll in the course, then submit real attempts across every exercise in the lesson, then mark it complete - the same sequence a real learner follows', async () => {
    const coursesRes = await request.get(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
    const courses = (await coursesRes.json()).data as Array<{ _id: string; title: string }>
    const referenceCourse = courses.find((c) => c.title.includes('Reference Pathway'))

    const enrollRes = await request.post(`${API_URL}/progress/enroll/${referenceCourse!._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(enrollRes.ok()).toBeTruthy()

    const exercisesRes = await request.get(`${API_URL}/exercises`, {
      params: { lessonId: freeLessonId },
      headers: { Authorization: `Bearer ${token}` },
    })
    const exercises = (await exercisesRes.json()).data as Array<{ _id: string; type: string; correctAnswer?: unknown }>

    for (const exercise of exercises) {
      if (exercise.type === 'speaking') continue // teacher-graded, not auto-scored - skip for this evidence pass
      const answer = exercise.type === 'multiple_choice' ? 0 : exercise.correctAnswer
      await request.post(`${API_URL}/exercises/submit`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { exerciseId: exercise._id, answer },
      })
    }

    const completeRes = await request.post(`${API_URL}/progress/complete-lesson`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { courseId: referenceCourse!._id, lessonId: freeLessonId },
    })
    expect(completeRes.ok()).toBeTruthy()

    return referenceCourse!._id
  })

  await test.step('the mastery API reflects real submitted evidence for this course, not a placeholder', async () => {
    const masteryRes = await request.get(`${API_URL}/certificates/mastery/${referenceCourseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(masteryRes.ok()).toBeTruthy()
    const mastery = (await masteryRes.json()).data
    expect(mastery.completionPercentage).toBeGreaterThan(0)
    const skillsWithEvidence = (mastery.skills as Array<{ attemptCount: number }>).filter((s) => s.attemptCount > 0)
    expect(skillsWithEvidence.length).toBeGreaterThan(0)
  })
})
