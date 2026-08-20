# Auralex Development Guide

This document explains how to work on Auralex after the current product pass, what to focus on next, and how to use the app effectively during development and QA.

## Product state

The current app already includes:

- public marketing pages
- authentication and email verification flows
- student, teacher, parent, moderator, and admin role handling
- teacher application workflow
- family-link approval workflow from learner and admin surfaces
- admin control center
- moderator permission scopes
- forum and groups
- live chat with unread indicators, notifications, and read receipts
- Stripe checkout session, billing portal, and webhook-based subscription syncing
- premium Auralex branding and updated UI system

## How to run the platform locally

### Requirements
- Node.js 20+
- npm
- MongoDB or MongoDB Atlas
- Git
- Docker optional

### Setup

Windows:

```powershell
.\setup.bat --no-pause
```

macOS/Linux:

```bash
bash ./setup.sh
```

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

### Local endpoints
- frontend: `http://localhost:5173`
- api: `http://localhost:5000`
- health: `http://localhost:5000/api/health`

## Core architecture to understand first

### Frontend
- React + TypeScript + Vite
- route-based product surfaces
- Zustand stores for auth, learning, and chat state
- shared Auralex UI tokens in [frontend/src/index.css](C:/Users/morea/language-learn-platform/frontend/src/index.css)

### Backend
- Express REST API
- MongoDB/Mongoose models
- JWT authentication
- Socket.io for live chat
- web-push for browser notification support

### High-signal areas
- [frontend/src/components/ChatRealtimeBridge.tsx](C:/Users/morea/language-learn-platform/frontend/src/components/ChatRealtimeBridge.tsx)
- [frontend/src/store/chatStore.ts](C:/Users/morea/language-learn-platform/frontend/src/store/chatStore.ts)
- [frontend/src/pages/admin/ControlCenter.tsx](C:/Users/morea/language-learn-platform/frontend/src/pages/admin/ControlCenter.tsx)
- [backend/src/controllers/chatController.js](C:/Users/morea/language-learn-platform/backend/src/controllers/chatController.js)
- [backend/src/server.js](C:/Users/morea/language-learn-platform/backend/src/server.js)
- [backend/src/middleware/auth.js](C:/Users/morea/language-learn-platform/backend/src/middleware/auth.js)

## Best way to use the app during QA

Use this order for realistic end-to-end verification:

1. **Admin first**
   - open control center
   - verify users, courses, moderation, support, and billing plan configuration
   - approve teacher applications if needed
   - review any family-link requests if needed
   - assign moderator scopes if needed

2. **Teacher second**
   - create a course
   - add lessons
   - confirm course appears in catalog and teacher workspace

3. **Student third**
   - enroll in a course
   - approve any pending family-link requests
   - verify dashboard, my learning, flashcards, groups, leaderboard, and chat

4. **Parent fourth**
   - request learner link
   - confirm pending state is visible until learner/admin approval
   - verify child progress view

5. **Support/community last**
   - create forum content
   - create/join groups
   - test support chat and read receipts

## What to focus on next

These are the most valuable next steps.

### 1. Commercial launch systems
Focus:
- Stripe live-key rollout
- Stripe portal configuration and plan-change rules
- invoices and refund workflows
- entitlements mapped to plans

Why:
- the subscription foundation now exists, but live operations, entitlements, and finance policy still need completion

### 2. Observability and ops
Focus:
- structured logs
- error reporting
- uptime checks
- chat/socket monitoring
- admin audit history

Why:
- commercial reliability depends on visibility into failures and regressions

### 3. Automated test coverage
Focus:
- database-backed integration tests
- auth flow tests
- admin role permission tests
- chat multi-user tests
- browser-level regression tests

Why:
- current validation is strong for builds and smoke checks, but deeper end-to-end protection is still needed

### 4. Content authoring quality
Focus:
- richer lesson editor
- file/media uploads
- ordering workflows
- course publishing states
- flashcard curation tools

Why:
- teacher and admin workflows work, but authoring can still become much more efficient

### 5. Community and moderation maturity
Focus:
- report workflows
- moderation queues
- support SLA surfaces
- moderator audit trails

Why:
- the hierarchy exists, but operational tooling can still be more complete

### 6. Payment and legal go-live
Focus:
- Stripe production configuration
- invoice and cancellation policy
- privacy/terms/cookies legal review
- support ownership and escalation rules

Why:
- these are required before taking live customer payments

## Development priorities by area

### Chat
- keep investigating websocket stability versus polling fallback
- reduce noisy refresh paths further if needed
- add direct tests for read receipts and multi-tab sync

### Admin
- consider bulk actions for users/content
- add clearer audit visibility for privileged actions

### Learner product
- add richer study history and achievement logic
- improve streak explanations and progress timelines

### Teacher product
- improve lesson editing depth
- add clearer publishing and draft lifecycle tools

### Parent product
- strengthen family approval workflow clarity
- add parent-specific notifications and summaries

## Verification commands

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

## Deployment workflow

### Frontend

```bash
cd frontend
npm run build
npm run deploy
```

### Backend

Deploy through Render with production environment variables configured.

Required production variables:

```env
NODE_ENV=production
MONGODB_URI=<atlas-uri>
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
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PRICE_LEARNER_MONTHLY=<price_id>
STRIPE_PRICE_FAMILY_MONTHLY=<price_id>
STRIPE_PRICE_TEACHING_MONTHLY=<price_id>
```

## Release checklist

Before each release:

1. run backend tests
2. run frontend build
3. verify public home, pricing, login, and legal pages
4. verify student, teacher, parent, chat, and admin authenticated surfaces
5. verify parent request -> learner/admin approval -> linked visibility flow
6. verify Stripe checkout redirect, webhook sync, and billing portal return flow
5. verify chat unread/read behavior
6. verify role restrictions still hold
7. deploy frontend
8. confirm production health endpoint and critical routes

## Security and hygiene

- never commit `.env` files
- never commit private VAPID keys or SMTP credentials
- rotate any exposed credentials immediately
- keep admin/moderator scope changes intentional and reviewed
- verify CORS settings whenever deployment origins change

## Recommended next implementation order

If continuing from this point, the best engineering order is:

1. payment integration
2. observability and alerting
3. deeper automated E2E and chat coverage
4. teacher content authoring improvements
5. moderation/reporting workflow depth

That sequence gives the best path from polished product demo to true commercial launch readiness.
