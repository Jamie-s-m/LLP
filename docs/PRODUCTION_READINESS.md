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
  undo that. **Whether the `moreartyjames@gmail.com` account's actual
  password has been rotated since the exposure is unconfirmed** - this is a
  founder-only action (no code or config change can verify or perform it)
  and should be checked directly before treating this as closed.
- SMTP is configured against Bird's relay (`eu1.smtp.bird.com:587`) and
  verified end-to-end with a real disposable-inbox signup/verification flow,
  not just checked at the API-call layer.
- Payme's webhook correctly rejects requests when `PAYME_MERCHANT_KEY` is
  unset (previously an unset key accepted Basic `Paycom:` with an empty
  password). Click integration does not exist in the backend; nothing
  references it in `.env.example`.

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
- Stripe billing webhook rewritten around one atomic `findOneAndUpdate`
  (closes a duplicate-webhook/TOCTOU race) with `charge.refunded` handling
  and event-ordering guards.

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
- Click (as opposed to Payme) payment integration does not exist.

## Ongoing operational practice

- Rotate any credential that is ever exposed in a commit, chat log, or
  script output - do not rely on deleting the file, since git history and
  most sharing channels retain it regardless.
- Run the production content seed only from a controlled environment,
  preceded by a backup and a `--dry-run` preview; see
  `backend/scripts/migrations/mcGradingBug/README.md` and
  [content/README.md](../content/README.md) for the full procedure.
