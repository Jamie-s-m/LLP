import { test, expect } from '@playwright/test'
import { registerAndVerify, randomEmail, simulateClickPayment, API_URL } from './helpers'

// Covers Phase 7 (the paywall) and the Payme/Click billing migration together, end to end: a
// gated lesson is genuinely locked for a no-plan student, a real Click payment webhook grants
// the plan (the same callback Click's own servers would call - see helpers.ts), and the
// previously-locked lesson becomes readable without the student doing anything else. This is
// the one path in this suite that mixes real UI navigation with a direct API call, because the
// actual third-party checkout page can't be automated here - see simulateClickPayment's comment.
test('gated lesson is locked for a no-plan student, then unlocks after a real Click payment', async ({ page, request }) => {
  const email = randomEmail('paywall')

  await test.step('register a new student account', async () => {
    await registerAndVerify(page, { firstName: 'Bo', lastName: 'Payer', email, password: 'E2ePassword123!' })
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
  })

  const userId = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').id)
  const token = await page.evaluate(() => localStorage.getItem('token'))
  expect(userId).toBeTruthy()

  const gatedLessonId = await test.step('find the seeded reference course\'s gated (A2) lesson via the API', async () => {
    const coursesRes = await request.get(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } })
    const courses = (await coursesRes.json()).data as Array<{ _id: string; title: string }>
    const referenceCourse = courses.find((c) => c.title.includes('Reference Pathway'))
    expect(referenceCourse, 'seeded reference course not found - was the E2E backend seeded?').toBeTruthy()

    const lessonsRes = await request.get(`${API_URL}/lessons`, {
      params: { courseId: referenceCourse!._id },
      headers: { Authorization: `Bearer ${token}` },
    })
    const lessons = (await lessonsRes.json()).data as Array<{ _id: string; order: number; cefr: string }>
    const gated = lessons.find((l) => l.order !== 1 && l.cefr !== 'A1')
    expect(gated, 'no gated lesson found in the seeded reference course').toBeTruthy()
    return gated!._id
  })

  await test.step('the gated lesson renders a locked upgrade card, not its real content', async () => {
    await page.goto(`/lesson/${gatedLessonId}`)
    await expect(page.getByText('This lesson is part of your plan')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: 'View plans' })).toBeVisible()
  })

  await test.step('simulate a real Click payment for the Local plan', async () => {
    await simulateClickPayment(request, { userId, plan: 'local', amountUzs: 39000 })
  })

  await test.step('reloading the same lesson now shows real content, not the locked card', async () => {
    await page.goto(`/lesson/${gatedLessonId}`)
    await expect(page.getByText('This lesson is part of your plan')).not.toBeVisible()
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 })
  })
})
