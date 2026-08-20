# LinguaNest

LinguaNest is a full-stack language learning workspace for students, teachers, parents, and platform administrators. It combines courses, lessons, exercises, flashcards, progress tracking, family links, realtime chat, browser notifications, and content moderation.

## Features

### Students
- Course enrollment and lesson completion
- API-backed dashboard, progress, profile, badges, and leaderboard
- Flashcards loaded from MongoDB
- Exercises submitted to the backend
- Study groups and community forum
- Realtime chat and browser notifications
- Optional teacher application reviewed by an admin

### Teachers
- Teacher accounts are created by admin approval
- Real course overview and instructor-owned course list
- Create courses and manage lessons
- View progress for learners enrolled in the teacher's courses
- Realtime chat and browser notifications

### Parents
- Parent signup with a dedicated family dashboard
- Request a link to a learner by email
- View approved learner XP, streak, weekly activity, and course progress
- Open a detailed child progress view
- Realtime chat and browser notifications

### Admins
- Unified Control Center
- User search, pagination, status management, and role management
- Teacher application approval/rejection
- Course create/edit/delete modal
- Content collections for lessons, flashcards, posts, and groups
- Forum/group moderation with pin and delete actions
- Platform overview and protected admin APIs

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Axios, React Router, Framer Motion
- Backend: Node.js 20+, Express, MongoDB, Mongoose, JWT, Socket.io, web-push
- Deployment: GitHub Pages for frontend, Render for backend, MongoDB Atlas for production data

## Quick Start

### Requirements

- Node.js 20+
- MongoDB locally or MongoDB Atlas
- npm
- Docker is optional; the setup scripts do not require Docker

### Automated setup

Windows PowerShell or Command Prompt:

```powershell
.\setup.bat --no-pause
```

macOS/Linux:

```bash
bash ./setup.sh
```

The scripts install missing dependencies with `npm ci` and create local env files from templates. They do not start MongoDB or either development server.

### Configure backend

Copy or edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/language-learn-platform
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
FRONTEND_APP_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
VAPID_PUBLIC_KEY=replace_with_vapid_public_key
VAPID_PRIVATE_KEY=replace_with_vapid_private_key
VAPID_SUBJECT=mailto:support@linguanest.app
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="LinguaNest <no-reply@linguanest.app>"
```

Never commit `.env` files or private VAPID keys. Use a separate production `MONGODB_URI`, `JWT_SECRET`, and VAPID private key in Render environment variables.

### Start backend

```bash
cd backend
npm ci
npm run dev
```

The API runs at `http://localhost:5000`.

### Start frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

The app runs at `http://localhost:5173`.

### Docker

Docker is optional. When installed:

```bash
docker compose up -d
```

The compose file starts MongoDB, backend, frontend, and Mongo Express for local development. Change all development passwords before using any shared or production environment.

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

## Production deployment

Frontend:

```bash
cd frontend
npm run build
npm run deploy
```

Production frontend: `https://jamie-s-m.github.io/LLP/`

Backend production environment must include:

```env
NODE_ENV=production
MONGODB_URI=<rotated-atlas-connection-string>
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

After a Render deploy, verify:

```text
GET /api/health       -> 200
GET /api/courses/seed -> 404
```

## Documentation

- [Development guide](./DEVELOPMENT.md)
- [Quick start](./QUICKSTART.md)
- [Backend guide](./backend/README.md)
- [Frontend guide](./frontend/README.md)
