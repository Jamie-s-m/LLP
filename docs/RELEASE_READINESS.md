# Release readiness checklist

## Functional readiness

- [x] Public app loads and routes work
- [x] Branding is centralized
- [x] Backend health endpoint responds
- [x] Courses area is visible to users
- [x] Learner dashboard structure exists
- [x] Real course content is seeded and connected to the API
- [x] Registration, enrollment, and lesson completion were smoke-tested against live MongoDB-backed API routes

## Content readiness

- [x] Starter course catalog is defined
- [x] Vocabulary library and placement bank are in the backend content model
- [x] Course library generator supports idempotent seeding
- [x] Demo DB is populated with seeded courses and flashcards
- [x] Lesson completion and progress updates are persisted in backend logic

## Production QA

- [x] Registration and login flow tested
- [ ] Placement test flow tested in a full production-like environment
- [x] Course enrollment tested
- [x] Lesson completion tested
- [ ] Dashboard recommendations tested against real progress data
- [ ] Mobile and tablet accessibility tested
- [ ] Parent, teacher, tutor and admin flows smoke-tested

## Blockers

- [ ] SMTP provider configuration for transactional email verification is required for production-ready authentication
- [ ] VITE_DEMO_MODE and runtime fallback diagnostics must be explicitly configured in production
- [ ] Full remote deployment smoke test of GitHub Pages + Render is still pending provider-level validation
- [ ] Payments, AI, and tutor flows remain not production-enabled or not fully validated

## Launch condition

The application is not yet safe to call fully production-ready under the strict acceptance model. It is validated for a live local learning flow and content pipeline, but the final deployment sign-off remains blocked by production messaging, remote environment validation, and broader business-flow QA.
