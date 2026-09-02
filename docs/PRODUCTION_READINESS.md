# Production readiness

Last verified against live production 2026-09-01. This file previously
described a pre-launch state (DNS unreachable, unrotated admin password);
that state no longer exists - production has been live and verified since
the Phase 4 release. See [docs/DEPLOYMENT.md](DEPLOYMENT.md) for the actual
deploy mechanism and [docs/ARCHITECTURE.md](ARCHITECTURE.md) for what's
really implemented.

## Current status: live

- `https://linguanest.uz` and `https://api.linguanest.uz/api/health` both
  return `200` (last checked 2026-09-01).
- The historical DNS-unreachable blocker is resolved (see the health checks
  above). The exposed `backend/resetPassword.js` script (hardcoded admin
  credential) no longer exists in the working tree, but it remains
  permanently recoverable from git history - deleting the file doesn't
  undo that. The `moreartyjames@gmail.com` account's password has been
  rotated since the exposure (confirmed directly by the account owner
  2026-09-01 - not independently verifiable from the database, since
  `User.js` has no password-specific change timestamp, only a generic
  `updatedAt` that any account activity touches).
- SMTP is configured against Bird's relay (`eu1.smtp.bird.com:587`) and
  verified end-to-end with a real disposable-inbox signup/verification flow,
  not just checked at the API-call layer.
- Payme's webhook correctly rejects requests when `PAYME_MERCHANT_KEY` is
  unset (previously an unset key accepted Basic `Paycom:` with an empty
  password). Stripe has been removed entirely (not available in
  Uzbekistan); billing now runs on Payme and Click exclusively - see
  `backend/tests/click.test.js` for the Click webhook's signature
  verification and Prepare/Complete lifecycle coverage.

## Verified in repository

- Frontend TypeScript/Vite build, ESLint (0 errors), Vitest suite.
- Backend Jest suite, ESLint (0 errors).
- CI (`.github/workflows/ci-cd.yml`) runs real lint + tests for both
  projects on every push/PR to `main` against a real MongoDB service
  container (not per-file in-memory servers). It validates only - deployment
  is Render's native GitHub auto-deploy, not a CI step; see
  [docs/DEPLOYMENT.md](DEPLOYMENT.md).
- Explicit, non-startup content seeding (`npm run content:seed` /
  `content:seed:production`), including a 32-question CEFR placement-test
  bank, idempotent via unique partial indexes on content identity keys.
- JWT authentication and role authorization.
- Production CORS restricted to configured HTTPS origins.
- Payme and Click billing webhooks (Stripe is not available in Uzbekistan and
  has been removed) both built around one atomic `findOneAndUpdate` per
  transaction (closes a duplicate-webhook/TOCTOU race), with idempotent
  replay on retried calls and cancellation handling.

## Known product limitations (not blockers - real, current gaps)

- Only `multiple_choice` and `fill_blank` exercises are auto-graded *and*
  present in the seeded catalog. `speaking` exercises are recorded and
  queued for teacher review. `listening` has a working auto-grading code
  path but zero seeded exercises exist, so it isn't reachable by a learner
  yet. `matching` and `writing` are schema-only - no generator content, no
  practice UI. See [docs/ARCHITECTURE.md](ARCHITECTURE.md) for the full
  breakdown.
- The hand-authored reference curriculum
  (`backend/src/data/referenceCurriculum.js`) covers one pathway (3 lessons,
  A1-B1). The full A1-C2 blueprint
  (`backend/src/data/curriculumBlueprint.js`) is a design document, not yet
  built out.
- Click integration is built and tested against the documented Merchant
  Shop-API protocol, but has not yet been verified against Click's live
  merchant cabinet with real credentials (still using dummy env values -
  `CLICK_SERVICE_ID`/`CLICK_MERCHANT_ID`/`CLICK_SECRET_KEY` need real
  values from Click's merchant onboarding before this rail can process a
  real payment).

## Ongoing operational practice

- Rotate any credential that is ever exposed in a commit, chat log, or
  script output - do not rely on deleting the file, since git history and
  most sharing channels retain it regardless.
- Run the production content seed only from a controlled environment,
  preceded by a backup and a `--dry-run` preview; see
  `backend/scripts/migrations/mcGradingBug/README.md` and
  [content/README.md](../content/README.md) for the full procedure.
