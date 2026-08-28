# LinguaNest

LinguaNest is a full-stack language-learning platform with courses, lessons,
exercises, vocabulary, flashcards, progress tracking, gamification, messaging,
tutors, family accounts, moderation, and subscriptions.

## Production architecture

- Frontend: Render Static Site
- API: Render Web Service
- Database: MongoDB Atlas
- Production frontend: https://linguanest.uz
- Production API: https://api.linguanest.uz

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), and
[docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md).

## Local development

```powershell
cd backend
npm ci
npm test
npm start
```

In another terminal:

```powershell
cd frontend
npm ci
$env:VITE_API_URL = "http://localhost:5000"
npm run dev
```

The backend content seed is explicit and never runs during application startup:

```powershell
cd backend
npm run content:seed
```

## Production builds

```powershell
cd frontend
npm ci
$env:VITE_API_URL = "https://api.linguanest.uz"
$env:VITE_APP_MODE = "production"
$env:VITE_DEMO_MODE = "false"
npm run build
```

```powershell
cd backend
npm ci
npm test -- --runInBand
```
