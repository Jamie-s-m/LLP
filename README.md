# Auralex

Auralex is a full-stack language learning platform for learners, teachers, parents, moderators, and administrators. It combines structured course delivery, learner progress tracking, family visibility, moderation, and live chat inside one premium workspace.

## What the app does

Auralex is built around five connected product surfaces:

1. **Learning**
   - public course catalog
   - learner dashboard
   - my learning workspace
   - lessons, exercises, flashcards, and leaderboard

2. **Teaching**
   - teacher dashboard
   - course creation
   - lesson management
   - learner progress review

3. **Family visibility**
   - parent dashboard
   - learner-link requests with learner/admin approval
   - child progress tracking

4. **Community and support**
   - forum
   - study groups
   - live chat with unread badges, notifications, and read receipts

5. **Platform operations**
   - admin control center
   - moderator permission scopes
   - user, course, content, moderation, support, and Stripe billing surfaces

## Role-by-role experience

### Student
- registers and verifies email
- browses courses and enrolls
- tracks progress from the learner dashboard and my learning
- studies with flashcards, lessons, groups, and leaderboard
- uses forum and chat
- can submit interest in becoming a teacher
- can approve or reject parent family-link requests directly from the learner dashboard

### Teacher
- is approved through the admin workflow
- accesses the teacher dashboard
- creates and manages courses and lessons
- reviews learner progress within owned courses
- uses chat for support and communication

### Parent
- signs up as a parent
- requests a link to a learner by email
- sees pending approval state until the learner, admin, or moderator reviews the request
- monitors linked learner progress, XP, and streaks
- opens detailed child progress views
- uses chat for support and communication

### Moderator
- is assigned by an admin
- receives scoped permissions instead of full admin access
- can be allowed to handle:
  - community moderation
  - support chat
  - catalog/content QA
  - limited user management

### Admin
- operates the control center
- manages users, roles, activity status, and teacher applications
- reviews pending family-link requests from the applications tab
- manages courses and content collections
- moderates forum and group content
- oversees support and Stripe billing surfaces

## Live product highlights

- Auralex premium branding and glassmorphism UI
- responsive public and authenticated layouts
- real-time chat bridge mounted globally for authenticated users
- unread badges and browser notification support
- chat delivery/read indicators
- moderator hierarchy with scoped permissions
- family-link approval from learner and admin workflows
- Stripe checkout, billing portal, and subscription syncing routes
- lazy-route reload protection for fresh deploys

## How the app works in practice

### Public flow
1. visitor lands on the Auralex home page
2. visitor browses courses and pricing
3. visitor creates an account
4. email verification completes
5. user signs in and is routed by role

### Learner flow
1. learner enters the dashboard
2. learner explores or resumes courses
3. lessons and flashcards build XP/streak momentum
4. forum, groups, leaderboard, and chat extend engagement

### Teacher flow
1. teacher enters the instructor dashboard
2. teacher creates or edits courses
3. teacher adds lessons
4. teacher tracks learner progress

### Parent flow
1. parent opens the family desk
2. parent submits learner link requests
3. learner or admin reviews the request
4. approved links expose learner progress details

### Admin and moderator flow
1. admin opens the control center
2. admin reviews users, applications, family links, content, moderation, and support
3. admin may create moderators with limited scopes
4. moderators work only inside their allowed areas
5. admin manages Stripe plan readiness and billing operations

## Best way to start using the app

For the best first run, use this order:

1. **Admin setup**
   - sign in as admin
   - open the control center
   - verify users, moderation scopes, and support coverage
   - create or review at least one course

2. **Teacher setup**
   - approve a teacher application or promote a teacher
   - create a course and at least one lesson

3. **Learner setup**
   - sign in as a student
   - enroll in a course
   - review dashboard, my learning, flashcards, groups, leaderboard, and chat

4. **Parent setup**
   - sign in as a parent
   - link a learner account
   - approve the request from the learner dashboard or admin applications tab
   - verify family progress visibility

5. **Support/community setup**
   - open forum and groups
   - create a support conversation
   - verify live chat updates and read receipts

## Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Axios, React Router, Framer Motion
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, Socket.io, web-push
- **Deployment:** GitHub Pages (frontend), Render (backend), MongoDB Atlas (database)

## Quick start

### Requirements
- Node.js 20+
- npm
- MongoDB locally or MongoDB Atlas
- Git
- Docker optional

### Automated setup

Windows:

```powershell
.\setup.bat --no-pause
```

macOS/Linux:

```bash
bash ./setup.sh
```

The setup scripts install dependencies and create local env files from templates.

## Environment configuration

### Backend

Create `backend/.env`:

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
VAPID_PUBLIC_KEY=replace_with_vapid_public_key
VAPID_PRIVATE_KEY=replace_with_vapid_private_key
VAPID_SUBJECT=mailto:support@auralex.app
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Auralex <no-reply@auralex.app>"
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PRICE_LEARNER_MONTHLY=<price_id>
STRIPE_PRICE_FAMILY_MONTHLY=<price_id>
STRIPE_PRICE_TEACHING_MONTHLY=<price_id>
```

### Frontend

Use `frontend/.env.local` when needed:

```env
VITE_API_URL=http://localhost:5000/api
VITE_VAPID_PUBLIC_KEY=<public-vapid-key>
```

Never commit `.env` files, private keys, or production secrets.

### Stripe setup notes

- create three recurring Stripe prices for learner, family, and teaching plans
- point the Stripe webhook at `/api/billing/webhook`
- subscribe at minimum to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- enable the Stripe customer portal if you want users to change plans or cancel through the app flow

## Run locally

### Backend

```bash
cd backend
npm ci
npm run dev
```

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

### Local URLs
- frontend: `http://localhost:5173`
- api: `http://localhost:5000`
- health: `http://localhost:5000/api/health`

## Verification

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm run build
```

## Production deployment

### Frontend

```bash
cd frontend
npm run build
npm run deploy
```

Production frontend:

`https://jamie-s-m.github.io/LLP/`

### Backend production variables

```env
NODE_ENV=production
MONGODB_URI=<atlas-connection-string>
JWT_SECRET=<long-random-secret>
FRONTEND_URL=https://jamie-s-m.github.io
FRONTEND_APP_URL=https://jamie-s-m.github.io/LLP
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:support@auralex.app
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
EMAIL_FROM="Auralex <no-reply@auralex.app>"
```

### Post-deploy checks

- `GET /api/health` returns `200`
- public pages load with current Auralex branding
- authenticated dashboards render correctly
- chat opens and unread/read indicators behave correctly

## Commercial readiness notes

The app is polished for product presentation and operational testing, but true commercial launch still depends on business integrations and operating policies such as:

- payment provider integration
- billing webhooks
- invoices and refund workflows
- legal review
- customer support ownership
- monitoring and incident response

## Documentation

- [Development guide](./DEVELOPMENT.md)
- [Quick start](./QUICKSTART.md)
- [Backend guide](./backend/README.md)
- [Frontend guide](./frontend/README.md)
