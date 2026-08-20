# LinguaNest Backend

Express/Mongoose API for LinguaNest. The server requires MongoDB and a JWT secret before it starts.

## Setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Required local variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/language-learn-platform
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
```

For browser push, configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`. Keep the private key out of Git.

## Roles

- `student`: learning, progress, groups, exercises, flashcards, chat
- `parent`: approved family links, child progress, chat
- `teacher`: instructor-owned courses, lessons, learner progress, chat
- `admin`: all user, application, content, and moderation operations

Teacher accounts are promoted by admin review. Registration only accepts Student or Parent, with an optional teacher application from Student.

## API areas

- `/api/auth` — registration and login
- `/api/users` — profile, dashboard summary, leaderboard, achievements
- `/api/courses` — public catalog plus teacher/admin CRUD and instructor overview
- `/api/lessons` — lessons plus teacher/admin update/delete
- `/api/exercises` — exercise retrieval, creation, and submissions
- `/api/flashcards` — flashcard retrieval, creation, and review
- `/api/progress` — enrollment, lesson completion, and teacher student progress
- `/api/groups` — study groups and membership
- `/api/forum` — posts and replies
- `/api/family` — parent requests, review, child progress aggregation
- `/api/chat` — conversations and messages
- `/api/push` — authenticated browser push subscribe/unsubscribe
- `/api/admin` — admin overview, users, teacher applications, and content CRUD

Socket.io provides authenticated realtime chat events: `conversation:join`, `message:send`, and `message:new`.

## Commands

```bash
npm run dev
npm start
npm test
npx eslint src
npm audit --omit=dev
npm run seed
```

The seed script is manual only. There is no public seed HTTP endpoint.
