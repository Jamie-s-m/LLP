# Monitoring baseline

There is no dedicated error-tracking or metrics service (Sentry-class)
wired up yet - this is a known, deliberate gap (see
[PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)), not an oversight this
document is pretending doesn't exist. Until one exists, everything below
uses tools already in place: Render's own dashboard, MongoDB Atlas, and the
app's own endpoints/logs. Treat this as the floor, not the target.

## What to check, and where

| Signal | Where to look | What "bad" looks like |
|---|---|---|
| Backend up/down | `https://api.linguanest.uz/api/health` (also Render's own health check against the same path) | Non-200, or Render shows the service as unhealthy/restarting |
| Frontend up/down | `https://linguanest.uz` loads | Non-200, blank page, or console errors on load |
| 5xx rate | Render dashboard -> `linguanest-api` service -> Logs, filter for `5` status lines; `errorHandler.js` is the single place all unhandled errors funnel through | A spike or sustained non-zero rate, not isolated one-offs |
| Auth failures | Backend logs for repeated 401s from `authMiddleware`/`authorize` | A burst from one IP/user (credential stuffing) rather than scattered normal failed logins |
| MongoDB errors / connection issues | Render backend logs (Mongoose connection-event logging) and MongoDB Atlas's own metrics/alerts (connections, ops/sec, replication lag) | Repeated reconnect attempts, `MongoServerSelectionError`, Atlas connection-count near its plan limit |
| Payment/webhook failures | Backend logs for `Payme webhook error:` / `Click webhook error:` (`billingController.js`); Payme's and Click's own merchant-cabinet callback logs | Any Payme or Click callback returning a non-success response |
| Duplicate-key errors (`E11000`) | Backend logs | Any occurrence on `contentKey` fields post-migration (would indicate the unique partial indexes caught something real) or on webhook/idempotency paths (would indicate the atomic-upsert guards are being exercised, which is expected occasionally, not necessarily bad - only alarming if the *response* to the duplicate isn't the expected idempotent one) |
| Grading correctness | No live monitor - spot-check via `GET /api/exercises/reviews/speaking*` (teacher review queue depth) and, if ever in doubt again, the same live correct/incorrect submission test used during Phase 5 verification |
| Certificate issuance anomalies | `Certificate` collection growth rate vs. `mastered`/`proficient` counts in `GET /api/admin/business-metrics` - a sudden spike unrelated to real usage would be the tell for a mastery-gating regression |
| Analytics pipeline health | `GET /api/admin/business-metrics` for zeroed/flat metrics that should be moving; a public-analytics-forgery attempt would show as an event type appearing in the `PUBLIC_ANALYTICS_EVENTS` stream that should only ever originate from a webhook (see `AnalyticsEvent.js`) |

## Product metrics (business health, not infra health)

Already computed, labeled FACT or ESTIMATE, at `GET /api/admin/business-metrics`
(`frontend`: `/admin/business-metrics`, admin-only):

- Onboarding completion rate (signup -> `onboardingCompletedAt`)
- Placement-test completion rate
- First-lesson completion rate
- D7 retention
- Checkout -> payment conversion (from real `User.billing` state, not the
  client analytics stream)
- MRR/ARPU (from `User.billing`, immune to the analytics-forgery class of
  bug fixed this phase)

Review these on a regular cadence once there's real user volume - at
current scale (a handful of real users) day-to-day movement is noise, not
signal.

## What "no monitoring service" means in practice today

If something breaks in production right now, the first signal is either a
user report or someone manually checking the health endpoint or Render
logs - there is no alert that pages anyone. Closing that gap (uptime
alerting at minimum, e.g. a free-tier synthetic check against
`/api/health`, before a real error-tracking service) is a reasonable
near-term follow-up, not done as part of this hardening pass since it adds
a new external dependency rather than making existing pieces more
trustworthy.
