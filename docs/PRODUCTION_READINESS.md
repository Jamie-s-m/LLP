# Production readiness

## CRITICAL - blocking production right now

- **The production backend is unreachable.** `api.linguanest.uz` (the URL
  baked into the deployed frontend's `VITE_API_URL`) has no DNS record at
  all - confirmed against Google's public resolver (8.8.8.8), not just a
  local/sandbox DNS issue. The `render.yaml`-declared web service name
  (`linguanest-api`) and the hostname referenced in `CORS_ORIGINS`
  (`lingua-nest.onrender.com`) both return Render's `x-render-routing:
  no-server` header, meaning Render has no live service routed to either
  hostname right now. The live homepage still *looks* fine to a visitor
  because the PWA service worker serves a stale cached `/courses` response
  from whenever the backend last actually worked (Workbox `NetworkFirst`
  caching) - but registration, login, and everything else that needs a live
  API call is broken for any real or first-time visitor. This needs someone
  with Render dashboard access to find the actual current backend service
  URL, confirm the service is live, and either add `api.linguanest.uz` as
  its custom domain (with DNS pointed at Render) or update
  `VITE_API_URL`/`CORS_ORIGINS` to the service's real address, then redeploy
  the frontend.
- **Rotate the `moreartyjames@gmail.com` admin account's password now.** A
  script committed to this **public** GitHub repository
  (`backend/resetPassword.js`, removed in this session's commit) hardcoded
  that account's email and a plaintext password. It has been publicly
  visible in git history since it was committed; deleting the file does not
  remove it from history. Rotating the actual account's password is the only
  thing that neutralizes the exposure.

## Verified in repository

- Frontend TypeScript/Vite build, ESLint (0 errors), Vitest suite
- Backend Jest suite (181 tests, 27 suites), ESLint (0 errors)
- CI (`.github/workflows/ci-cd.yml`) now runs real lint + tests for both
  projects on every push/PR to `main`, not just a frontend build and a bare
  backend import smoke test
- Explicit, non-startup content seeding, including a 32-question CEFR
  placement-test bank
- JWT authentication and role authorization
- Production CORS configuration (see the DNS blocker above re: which origin
  is actually live)
- API health endpoint (`/api/health`)
- Render frontend SPA rewrite
- Render-only deployment configuration

## Before launch

- Resolve the backend-unreachable blocker above - nothing else here matters
  until real traffic can reach the API.
- Configure MongoDB Atlas network access and production credentials.
- Replace any exposed or previously shared secrets with newly generated
  credentials (see the admin password rotation above).
- Configure verified SMTP credentials and sender domain - `backend/.env`
  (local, gitignored) now points at Bird's SMTP relay
  (`eu1.smtp.bird.com:587`, user `bird`); Render's backend service still
  needs the same `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS`
  values added to its environment for production email to work.
- Configure Payme/Click merchant credentials and signed webhook endpoints.
  Payme's webhook now correctly rejects requests when `PAYME_MERCHANT_KEY`
  is unset (previously an unset key accepted Basic `Paycom:` with an empty
  password); it still needs a real merchant key before going live. Click
  integration doesn't exist in the backend yet - `.env.example` no longer
  references it since documenting unimplemented config was misleading.
- Run the explicit production content seed from a controlled environment
  once the backend is reachable again.
- Smoke-test registration, login, courses, lessons, exercises (all 4 working
  types: multiple-choice, fill-blank, listening, speaking-with-review),
  the placement test, progress, flashcards, messaging, and payment
  callbacks.
