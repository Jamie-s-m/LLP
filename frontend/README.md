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

Email verification links land on [VerifyEmail.tsx](C:/Users/morea/language-learn-platform/frontend/src/pages/auth/VerifyEmail.tsx), which calls the backend `/api/auth/verify-email` endpoint and lets the user resend verification emails when needed.

Password reset uses [ForgotPassword.tsx](C:/Users/morea/language-learn-platform/frontend/src/pages/auth/ForgotPassword.tsx) and [ResetPassword.tsx](C:/Users/morea/language-learn-platform/frontend/src/pages/auth/ResetPassword.tsx). Chat unread counts are surfaced in the navbar, floating launcher, and [Chat.tsx](C:/Users/morea/language-learn-platform/frontend/src/pages/Chat.tsx).

## Routes

Public:

- `/`
- `/courses`
- `/courses/:id`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
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
