import crypto from 'node:crypto'
import type { APIRequestContext, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const API_URL = 'http://localhost:5050/api'

export function randomEmail(prefix: string) {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}@e2e.linguanest.test`
}

// Drives the real registration UI (not a direct API call) - the point of this spec is to walk
// the actual signup funnel, matching how a real learner would arrive at a paying account. This
// app deliberately requires email verification before a new account can sign in (confirmed live
// - registering lands on /verify-email, not /onboarding, regardless of whatever token localStorage
// already holds). Real mail delivery isn't available in this environment (no real inbox for a
// synthetic @e2e.linguanest.test address), so this follows the same dev-mode "verify right away
// with this link" affordance VerifyEmail.tsx itself renders whenever email delivery fails -
// clicking that real link is what a real user would do if their verification email arrived, so
// this is a faithful simulation of the real flow, not a shortcut around it. Ends logged in,
// having navigated through /login for real.
export async function registerAndVerify(page: Page, opts: { firstName: string; lastName: string; email: string; password: string }) {
  await page.goto('/register')
  await page.getByLabel('First Name').fill(opts.firstName)
  await page.getByLabel('Last Name').fill(opts.lastName)
  await page.getByLabel('Email Address').fill(opts.email)
  await page.getByLabel('Password', { exact: true }).fill(opts.password)
  await page.getByRole('button', { name: 'Create Account' }).click()

  await expect(page).toHaveURL(/\/verify-email/, { timeout: 15_000 })
  const previewLink = page.locator('a[href*="/verify-email?token="]')
  await expect(previewLink).toBeVisible({ timeout: 15_000 })
  const previewUrl = await previewLink.getAttribute('href')
  expect(previewUrl, 'no dev-mode verification preview link rendered - was email delivery meant to succeed here?').toBeTruthy()

  await page.goto(previewUrl!)
  await expect(page.getByRole('link', { name: /continue to sign in/i })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('link', { name: /continue to sign in/i }).click()

  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  await page.getByLabel('Password', { exact: true }).fill(opts.password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

// Completes all 3 onboarding steps, always picking the first available option per step - this
// spec cares that the flow completes and hands off to placement, not which specific goal/level/
// time a synthetic E2E account reports.
//
// Scoped to .atlas-panel (the step content card) rather than a bare page-wide
// getByRole('button', {pressed: false}) - confirmed live (via a failure screenshot) that an
// unscoped query also matches the Navbar's language-toggle button, which has no aria-pressed
// attribute at all; Playwright's pressed:false filter treats "no aria-pressed" as matching
// false too, not just an explicit aria-pressed="false". Clicking it opened the language menu
// instead of selecting a goal option, leaving the real "Continue" button disabled forever.
export async function completeOnboarding(page: Page) {
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 })
  const panel = page.locator('.atlas-panel')
  for (let step = 1; step <= 3; step += 1) {
    const firstOption = panel.getByRole('button', { pressed: false }).first()
    await firstOption.click()
    await panel.getByRole('button', { name: /continue|see my result/i }).click()
  }
}

// Completes the real placement test end to end via the UI, always picking the first option -
// this spec is verifying the flow reaches a resolved lesson, not testing placement scoring
// accuracy (that's masteryEngine.test.js's job on the backend).
export async function completePlacementTest(page: Page) {
  await expect(page).toHaveURL(/\/placement-test/, { timeout: 15_000 })
  await page.getByRole('button', { name: /start test|resume test/i }).click()

  const progress = page.getByRole('progressbar').first()
  await expect(progress).toBeVisible({ timeout: 15_000 })
  const totalQuestions = Number(await progress.getAttribute('aria-valuemax'))

  // Scoped to .atlas-panel - see completeOnboarding's comment on why an unscoped
  // getByRole('button', {pressed: false}) also matches the Navbar's language toggle.
  const panel = page.locator('.atlas-panel')
  for (let i = 0; i < totalQuestions; i += 1) {
    await panel.getByRole('button', { pressed: false }).first().click()
    await panel.getByRole('button', { name: /next|see my result/i }).click()
  }
}

interface ClickSignParams {
  click_trans_id: string
  service_id: string
  merchant_trans_id: string
  merchant_prepare_id?: string
  amount: string
  action: string
  sign_time: string
}

// Mirrors backend/tests/click.test.js's exact signing algorithm - this is the one step in the
// critical revenue path that cannot realistically be automated through the real UI (Click's
// hosted checkout is a third-party page this suite has no test credentials for, and even a real
// merchant account wouldn't want E2E runs completing genuine charges). Every other step in this
// suite drives the real browser; this one calls the same webhook Click itself would call, the
// same way the backend's own signature-verification tests do.
function signClickParams(params: ClickSignParams, secretKey: string) {
  const parts = [params.click_trans_id, params.service_id, secretKey, params.merchant_trans_id]
  if (params.merchant_prepare_id !== undefined) parts.push(params.merchant_prepare_id)
  parts.push(params.amount, params.action, params.sign_time)
  return crypto.createHash('md5').update(parts.join('')).digest('hex')
}

// Simulates a full, successful Click Prepare -> Complete payment callback for one plan, exactly
// as Click's own servers would call this app's webhook after a real hosted checkout succeeds.
export async function simulateClickPayment(
  request: APIRequestContext,
  opts: { userId: string; plan: string; amountUzs: number }
) {
  const serviceId = 'e2e_click_service'
  const secretKey = 'e2e_click_secret'
  const clickTransId = `e2e-${crypto.randomBytes(6).toString('hex')}`
  const merchantTransId = `${opts.userId}:${opts.plan}:${crypto.randomBytes(4).toString('hex')}`
  const signTime = String(Date.now())
  const amount = String(opts.amountUzs)

  const prepareParams: ClickSignParams = {
    click_trans_id: clickTransId,
    service_id: serviceId,
    merchant_trans_id: merchantTransId,
    amount,
    action: '0',
    sign_time: signTime,
  }
  const prepareRes = await request.post(`${API_URL}/billing/click`, {
    form: {
      ...prepareParams,
      sign_string: signClickParams(prepareParams, secretKey),
      error: '0',
      error_note: 'Success',
    },
  })
  const prepareBody = await prepareRes.json()
  if (prepareBody.error !== 0) {
    throw new Error(`Click Prepare failed: ${JSON.stringify(prepareBody)}`)
  }

  const completeParams: ClickSignParams = {
    click_trans_id: clickTransId,
    service_id: serviceId,
    merchant_trans_id: merchantTransId,
    merchant_prepare_id: String(prepareBody.merchant_prepare_id),
    amount,
    action: '1',
    sign_time: signTime,
  }
  const completeRes = await request.post(`${API_URL}/billing/click`, {
    form: {
      ...completeParams,
      sign_string: signClickParams(completeParams, secretKey),
      error: '0',
      error_note: 'Success',
    },
  })
  const completeBody = await completeRes.json()
  if (completeBody.error !== 0) {
    throw new Error(`Click Complete failed: ${JSON.stringify(completeBody)}`)
  }
}
