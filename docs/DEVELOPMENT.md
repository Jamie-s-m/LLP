# Local development

## Prerequisites

- Node.js 20+ (CI runs on 24.x)
- No local MongoDB install is required. Backend tests always use an
  in-process `mongodb-memory-server` instance (see `backend/tests/jest.setup.js`)
  and that same package can stand in for a real database while developing
  locally, without touching MongoDB Atlas or installing MongoDB yourself.

## Environment files

Copy the example files and fill in real values as needed:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

`backend/.env.example` and `frontend/.env.example` are kept in sync with
every environment variable the code actually reads (`process.env.*` /
`import.meta.env.*`) - if you add a new one, add it there too so this stays
true.

## Quick start (disposable local database)

This is the fastest way to run the app locally without a real MongoDB
instance. Run each command in its own terminal from the repo root.

**1. Start a disposable in-memory MongoDB:**

```powershell
cd backend
node -e "import('mongodb-memory-server').then(async ({ MongoMemoryServer }) => { const m = await MongoMemoryServer.create({ instance: { port: 27099 } }); console.log(m.getUri()); setInterval(() => {}, 1 << 30); })"
```

Leave this running. It prints a `mongodb://127.0.0.1:27099/` URI.

**2. Seed real content into it (courses, lessons, exercises, placement
questions, flashcards) and start the backend:**

```powershell
cd backend
$env:MONGODB_URI = "mongodb://127.0.0.1:27099/linguanest_dev"
$env:JWT_SECRET = "local-dev-secret"
node src/seed.js --mode=development
npm start
```

Demo accounts are created by the seed script (see `backend/src/seed.js`):
`student@demo.linguanest.local` / `DemoStudent123!`,
`teacher@demo.linguanest.local` / `DemoTeacher123!`,
`parent@demo.linguanest.local` / `DemoParent123!`,
`admin@demo.linguanest.local` / `DemoAdmin123!` (all pre-verified).

**3. Start the frontend, pointed at that backend:**

```powershell
cd frontend
$env:VITE_API_URL = "http://localhost:5000/api"
npm run dev
```

Open http://localhost:5173. Local outbound email is unconfigured by
default; `POST /api/auth/resend-verification` returns the verification/reset
link directly in its JSON response body (and logs it) instead of sending an
email, so you can complete those flows without SMTP.

## Tests

```powershell
cd backend && npm test        # Jest, spins up its own in-memory MongoDB - no setup needed
cd frontend && npm test -- run  # Vitest, single run (omit "-- run" to watch)
```

## Lint

```powershell
cd backend && npx eslint src
cd frontend && npm run lint
```

Both are wired into CI (`.github/workflows/ci-cd.yml`) alongside the test
suites and the frontend production build.

## Production builds

See the root [README.md](../README.md) for the production build commands,
and [DEPLOYMENT.md](DEPLOYMENT.md) / [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)
for what still needs to be true before a deploy is actually launch-ready.
