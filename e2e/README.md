# End-to-end tests (Playwright)

Covers the critical revenue path end to end against a real backend + frontend + database, not
mocks: signup → email verification → onboarding → placement test → a real gated lesson locked by
the Phase 7 paywall → a real Payme/Click billing webhook unlocking it → exercise submission →
mastery evidence. See each spec file's own header comment for what it covers and why.

## Running locally

```bash
npm install               # once, at the repo root
npx playwright install --with-deps chromium   # once, downloads the browser
npm run test:e2e          # runs the suite headless
npm run test:e2e:ui       # interactive UI mode - the fastest way to debug a failure
```

`playwright.config.ts`'s `webServer` array starts everything needed automatically: a dedicated
backend (`backend/scripts/e2e-server.mjs`, port 5050) and frontend (Vite dev server, port 5180),
both separate from whatever you might already have running locally for manual QA (the usual
5000/5173 pair) so the two don't collide or share state.

`e2e-server.mjs` spins up its own disposable `mongodb-memory-server` instance (port 27019,
database `linguanest-e2e`) when `MONGODB_URI` isn't already set, seeds it with real course
content, and only then starts the real Express server - see that script's own comments for why
this has to happen in one sequenced process rather than as separate `webServer` entries.

## Running in CI

The `e2e` job in `.github/workflows/ci-cd.yml` runs after `build-and-test` passes, using the same
real `mongodb:7` service container pattern as the Jest suite (a different database name so the
two never collide) - `MONGODB_URI` is set directly there, so `e2e-server.mjs` skips its local
`mongodb-memory-server` fallback entirely in CI.

## Why some steps call the API directly instead of clicking through the UI

Every step a real user could actually perform in a browser is driven through the real UI -
registration, onboarding, the real 32-question placement test, viewing a locked lesson, exercise
submission. Two things are called via direct HTTP request instead, each with its own comment at
the call site explaining why:

- **The Click payment** (`helpers.ts`'s `simulateClickPayment`) - Click's hosted checkout is a
  real third-party page this suite has no test credentials for, and even a real merchant account
  wouldn't want CI runs completing genuine charges. This calls the exact same webhook Click's own
  servers would call after a real checkout succeeds - the same signature-verified callback
  `backend/tests/click.test.js` exercises at the integration level.
- **Bulk exercise attempts for mastery evidence** (`exercise-and-mastery.spec.ts`) - reaching
  certificate-eligible mastery needs real coverage across many exercises by design (the
  anti-gaming guard in `masteryEngine.js` requires genuine distinct-exercise evidence, not just
  attempt count). Clicking through dozens of exercises one at a time in a browser would make this
  suite slow and brittle for no real coverage gain over what `masteryEngine.test.js` already
  proves at the integration level - this suite's job is confirming a human submitting *one* real
  exercise through the live UI gets correctly graded, and that accumulated evidence (built the
  same way, just called directly) is what the mastery API and certificate flow actually reflect.
