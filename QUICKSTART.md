# LinguaNest Quick Start

## 1. Install prerequisites

- Node.js 20+
- MongoDB locally or MongoDB Atlas
- npm

Docker is optional.

## 2. Run setup

From the repository root:

```powershell
.\setup.bat --no-pause
```

macOS/Linux:

```bash
bash ./setup.sh
```

The script installs dependencies and creates `backend/.env` and `frontend/.env.local` from templates. It does not start MongoDB or the servers.

## 3. Configure backend

Edit `backend/.env` and set at least:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/language-learn-platform
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
```

For browser notifications, also set VAPID values. The public key may be exposed to the frontend; the private key must remain only in backend/Render environment variables.

## 4. Start the API

```bash
cd backend
npm run dev
```

Health check: `http://localhost:5000/api/health`

## 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

## 6. First user flows

1. Register as Student or Parent.
2. A student can optionally apply to become a Teacher.
3. An admin reviews teacher applications in `/admin/control-center`.
4. A parent requests a learner link by email.
5. The learner or admin approves the family request.
6. Students enroll in courses and complete lessons.
7. Teachers create courses and manage lessons.
8. Users can enable browser notifications from the bell icon.

## 7. Verify before release

```bash
cd backend
npm test
npx eslint src
npm audit --omit=dev

cd ../frontend
npm run build
npm audit --omit=dev
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for deployment and release details.
