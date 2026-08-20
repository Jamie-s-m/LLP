# LinguaNest Frontend

React/Vite frontend for LinguaNest with TypeScript, Tailwind CSS, Zustand, Axios, React Router, Framer Motion, Socket.io, and browser push notifications.

## Setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Local variables:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=LinguaNest
VITE_VAPID_PUBLIC_KEY=<backend-vapid-public-key>
```

The VAPID public key is safe in frontend configuration. Never put the private key in this directory or in a Vite variable.

## Routes

Public:

- `/`
- `/courses`
- `/courses/:id`
- `/login`
- `/register`
- `/forgot-password`
- `/forum`

Student:

- `/dashboard`
- `/my-learning`
- `/lesson/:id`
- `/exercise/:id`
- `/flashcards`
- `/groups`
- `/leaderboard`
- `/profile`

Parent:

- `/parent/dashboard`
- `/parent/children/:studentId`

Teacher:

- `/teacher/dashboard`
- `/teacher/create-course`
- `/teacher/manage/:courseId`
- `/teacher/progress/:studentId`

Admin:

- `/admin/control-center`

Shared authenticated route:

- `/chat`

## Browser notifications

The bell button in the authenticated Navbar requests permission, registers `public/sw.js`, and stores the Push API subscription through `/api/push/subscribe`. Notifications are sent for new chat messages and teacher applications when backend VAPID variables are configured.

## Verification and deployment

```bash
npm run build
npm audit --omit=dev
npm run deploy
```

Production frontend: `https://jamie-s-m.github.io/LLP/`.
