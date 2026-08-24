LinguaNest — Architecture Overview

Purpose

This document captures the high-level architecture and the planned phased roadmap to transform the existing LLP codebase into LinguaNest (linguanest.uz). It is a living reference used to coordinate rebrand, infra, and feature work.

Platform summary

- Hosting: Render (web + API) for managed deployments and easy CI integration.
- Frontend: React + Vite + TypeScript. Framer Motion for transitions, Lottie/three.js for enhanced hero effects, Agora Web SDK for live lessons.
- Backend: Node.js (Express/Nest recommended) with Prisma as ORM for PostgreSQL.
- Primary DB: PostgreSQL; Migrations via Prisma Migrate.
- Cache & fast-state: Redis (leaderboards, slot locks, queues).
- Background jobs: BullMQ (Redis) for email/invoice/job processing.
- Media storage: S3-compatible (AWS S3 or DigitalOcean Spaces).
- Payment providers: Stripe (global), Payme + Click (Uzbek local gateways).
- Video provider: Agora (token generation + client SDK).
- Realtime: Socket.io (or ws) with Redis adapter for horizontal scaling.

Core services and responsibilities

- API Gateway / Main API
  - Authentication (JWT + refresh tokens, OAuth Google)
  - User management & RBAC
  - Courses, Modules, Lessons CRUD
  - Tutoring marketplace: tutor profiles, availability, bookings
  - Payments: capture, webhook handlers, transaction records
  - Gamification: XP, streaks, badges API
  - WebRTC token endpoint (Agora token generation)
  - Realtime events for chat and notifications

- Payments Service (can be a logical module or microservice)
  - Provider adapters (Stripe, Payme, Click)
  - Webhook signature verification
  - Transaction reconciliation and invoice generation

- Video Connector (token service)
  - Secure token issuance for Agora per lesson/channel
  - Session orchestration: create channel names, map user roles

- Background worker
  - Job queue for outbound emails, invoice PDF generation, payment retries, leaderboard persistence

- Admin / Moderation
  - Content moderation queues, family link approvals, dispute handling, audit logs

Data model highlights (abbreviated)

- User: id, email, name, role, language, timezone, avatarUrl, stripeCustomerId
- TutorProfile: userId, languages[], hourlyRate, introVideoUrl, certificates[], availabilityJson
- Course/Module/Unit/Lesson: structured, lessons store content as typed JSON, localized fields for title/description
- Booking: tutorId, studentId, startAt, endAt, status, amount, paymentStatus
- PaymentTransaction: provider, providerId, amount, status, metadata
- Achievement: userId, badge, awardedAt

Phased roadmap (PR-sized work breakdown)

Phase A (Rebrand + production readiness)
- A1: Rebrand assets & meta (small, safe) — package.json, index.html title, logos, README, .env.example
- A2: Theme tokens & chat message contrast, read receipt UI
- A3: Chat notifications & read/delivery receipts (frontend + backend event stubs)
- A4: CI/CD skeleton, docker-compose.linguanest.yml, Render deployment notes

Phase B (Payments)
- B1: Stripe integration + webhook handler
- B2: Payme & Click adapters (dev stubs → production wiring)
- B3: Invoice generation (background jobs)

Phase C (Marketplace & bookings)
- C1: Tutor profile CRUD + discovery UI
- C2: Availability calendar, slot locking (Redis atomic lock)
- C3: Booking flow + payment capture + confirmation emails

Phase D (Gamified learning engine)
- D1: Course & lesson models + sample seeded course
- D2: Lesson player (MCQ, listening, speaking scaffold)
- D3: Gamification engine (XP, streaks, leaderboards cached in Redis)

Phase E (Live lessons)
- E1: Agora integration (token endpoint + client). Video + chat + whiteboard links
- E2: Optional session recording & telemetry

Phase F (Localization)
- F1: Server-side localized fields for dynamic content
- F2: Translation workflow for course content

Admin & governance

- Enforce RBAC via middleware (student, tutor, admin)
- Audit logs for moderation and payments
- Rate limiting per-IP and per-user endpoints

Operational notes

- Use Prisma for DB access; Prisma Migrate for schema evolution.
- Prefetch and cache leaderboard snapshots in Redis periodically and persist snapshots to Postgres per day.
- Use Render's cron/jobs for scheduled tasks or deploy a worker service for BullMQ.

Next immediate artifacts to create

- REBRAND_PLAN.md (search/replace checklist and safe rename steps)
- .env.example (LinguaNest defaults)
- docker-compose.linguanest.yml (developer local stack)

Contact & credentials required to proceed to implementation

- Agora APP_ID & APP_CERT
- Stripe secret key & webhook secret
- Payme & Click merchant credentials (or sandbox keys)
- Render account / project details (for final deploy)

End of ARCHITECTURE.md
