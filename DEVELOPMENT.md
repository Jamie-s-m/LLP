# LinguaNest Development Guide

## Requirements

- Node.js 20+
- npm
- MongoDB locally or MongoDB Atlas
- Git
- Docker is optional

## Setup scripts

From the repository root on Windows:

```powershell
.\setup.bat --no-pause
```

The script uses `npm ci`, creates `backend/.env` and `frontend/.env.local` from templates, and exits non-zero when setup fails. Without `--no-pause`, it waits at the end for a key press.

On macOS/Linux:

```bash
bash ./setup.sh
```

The scripts do not start MongoDB or dev servers.

## Local configuration

Create `backend/.env` from `backend/.env.example` and set:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/language-learn-platform
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
FRONTEND_APP_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:support@linguanest.app
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="LinguaNest <no-reply@linguanest.app>"
```

Only the VAPID public key belongs in frontend configuration as `VITE_VAPID_PUBLIC_KEY`. Never commit `.env` files or a VAPID private key. Email verification uses `FRONTEND_APP_URL` to build the verification link and SMTP variables to deliver it.

## Run locally

Backend terminal:

```bash
cd backend
npm ci
npm run dev
```

Frontend terminal:

```bash
cd frontend
npm ci
npm run dev
```

URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`

## Current role model

- Student: learning, progress, flashcards, exercises, groups, chat, optional teacher application.
- Teacher: approved instructor, own courses, lessons, learner progress, chat.
- Parent: approved family links, child progress, chat.
- Admin: users, teacher applications, courses, lessons, flashcards, groups, posts, moderation, chat.

Admin and teacher accounts must not be created by selecting privileged roles in the public signup form. Student signup can include a teacher application; admin approval promotes it to teacher.

## Important API areas

- `/api/auth` — register/login
- `/api/users` — profile, dashboard summary, leaderboard, achievements
- `/api/courses` — catalog and teacher/admin CRUD
- `/api/lessons` — lesson CRUD with ownership checks
- `/api/exercises` — exercises and submissions
- `/api/flashcards` — flashcards and review
- `/api/progress` — enrollment, completion, teacher progress
- `/api/groups` and `/api/forum` — community
- `/api/family` — parent requests and child progress aggregation
- `/api/chat` — REST conversation/message fallback
- Socket.io — authenticated realtime chat
- `/api/push` — browser push subscriptions
- `/api/admin` — protected admin operations

## Verification

```bash
cd backend
npm test
npx eslint src
npm audit --omit=dev

cd ../frontend
npm run build
npm audit --omit=dev
```

`npm test` currently runs the Express smoke suite without MongoDB. Full registration, database, Socket.io, and push click-through testing requires a configured test MongoDB URI in the local, ignored `backend/.env`.

## Deployment

Frontend:

```bash
cd frontend
npm run build
npm run deploy
```

Production frontend: `https://jamie-s-m.github.io/LLP/`.

Backend is deployed on Render. Configure these Render variables before deploy:

```env
NODE_ENV=production
MONGODB_URI=<rotated-atlas-uri>
JWT_SECRET=<long-random-secret>
FRONTEND_URL=https://jamie-s-m.github.io
FRONTEND_APP_URL=https://jamie-s-m.github.io/LLP
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:support@linguanest.app
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
EMAIL_FROM="LinguaNest <no-reply@linguanest.app>"
```

After deployment:

```text
GET /api/health       -> 200
GET /api/courses/seed -> 404
```

## Security checklist

- Rotate credentials that were ever committed or shared.
- Keep MongoDB, JWT, and VAPID private values only in local ignored files or Render secrets.
- Do not expose a seed endpoint.
- Keep CORS limited to the deployed frontend and local development origins.
- Run npm audits before release.
- Use `NODE_ENV=production` on Render.
