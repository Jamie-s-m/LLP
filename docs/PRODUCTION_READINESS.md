# Production readiness

## Verified in repository

- Frontend TypeScript/Vite build
- Backend Jest suite
- Explicit, non-startup content seeding
- JWT authentication and role authorization
- Production CORS configuration
- API health endpoint
- Render frontend SPA rewrite
- Render-only deployment configuration

## Before launch

- Configure MongoDB Atlas network access and production credentials.
- Replace any exposed or previously shared secrets with newly generated
  credentials.
- Configure verified SMTP credentials and sender domain.
- Configure Payme/Click merchant credentials and signed webhook endpoints.
- Add `linguanest.uz` and `api.linguanest.uz` in Render and wait for HTTPS
  certificates.
- Run the explicit production content seed from a controlled environment.
- Smoke-test registration, login, courses, lessons, progress, flashcards,
  messaging, and payment callbacks.
