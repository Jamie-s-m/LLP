# LinguaNest Architecture (Updated 2026-08-25)

## Purpose

This document captures the high-level architecture and implementation status of LinguaNest (linguanest.uz), a comprehensive language learning and tutoring marketplace platform.

---

## Current Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (primary), Redux Toolkit (planned for removal)
- **Animations**: Framer Motion
- **Real-time**: Socket.io Client
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Language**: JavaScript (TypeScript migration planned)
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT + httpOnly cookies (planned)
- **Real-time**: Socket.io
- **Security**: Helmet, express-mongo-sanitize, DOMPurify
- **Logging**: Winston (structured logging)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Payments**: Stripe
- **Push Notifications**: web-push

### Infrastructure
- **Hosting**: 
  - Frontend: GitHub Pages (production) / Netlify (staging)
  - Backend: Render
  - Database: MongoDB Atlas
- **CI/CD**: GitHub Actions
- **Deployment**: Docker support available
- **Caching**: Redis (planned, not yet implemented)
- **Queue**: BullMQ (planned, not yet implemented)

---

## Database Schema (MongoDB)

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  role: Enum ['student', 'teacher', 'parent', 'moderator', 'admin'],
  moderatorPermissions: {
    communityModeration: Boolean,
    supportChat: Boolean,
    catalogContentQa: Boolean,
    limitedUserManagement: Boolean
  },
  isEmailVerified: Boolean,
  emailVerificationToken: String (hashed, indexed),
  passwordResetToken: String (hashed, indexed),
  avatar: String,
  nativeLanguage: String,
  targetLanguages: [String],
  xp: Number,
  streak: Number,
  lastActiveDate: Date,
  isActive: Boolean (indexed),
  children: [ObjectId] (ref: User),
  parents: [ObjectId] (ref: User),
  teacherApplicationStatus: Enum,
  billing: {
    plan: Enum ['none', 'learner', 'family', 'teaching'],
    status: Enum,
    stripeCustomerId: String (indexed),
    stripeSubscriptionId: String (indexed),
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean
  },
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes**: email, role, isActive, emailVerificationToken, passwordResetToken, billing.stripeCustomerId, billing.stripeSubscriptionId, createdAt

#### Courses
- Indexed on: isPublished + createdAt (compound), instructor, language, difficulty

#### ChatConversations
- Indexed on: participants, lastMessageAt

#### ChatMessages
- Indexed on: conversation + createdAt (compound), sender, readBy

---

## Core Features

### 1. Learning Platform
- Public course catalog with search/filtering
- Learner dashboard with progress tracking
- Interactive lessons and exercises
- Flashcard system for vocabulary
- Gamification: XP, streaks, leaderboards
- Study groups and forum

### 2. Teaching Tools
- Teacher dashboard
- Course creation and management
- Lesson builder
- Student progress analytics
- Content moderation tools

### 3. Family Portal
- Parent accounts with child linking
- Family-link approval workflow (learner/admin approval required)
- Child progress monitoring
- Activity tracking

### 4. Real-time Communication
- Live chat with Socket.io
- Unread message badges
- Delivery and read receipts
- Browser push notifications
- Chat history and search

### 5. Administration
- Admin control center
- User management (activate/deactivate)
- Teacher application approval workflow
- Family-link request moderation
- Content moderation
- Role-based access control (RBAC)
- Moderator permission scoping

### 6. Billing & Subscriptions
- Stripe integration
- Three subscription tiers: Learner, Family, Teaching
- Webhook handling for subscription events
- Customer portal for plan management
- Invoice generation (planned)

---

## Authentication & Security

### Current Implementation
- ✅ JWT tokens (Bearer authentication)
- ✅ bcrypt password hashing (native, 10 rounds)
- ✅ Email verification with hashed tokens
- ✅ Password reset with hashed tokens
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting (IP-based, per-route)
- ✅ Input sanitization (MongoDB injection prevention)
- ✅ XSS protection (DOMPurify)
- ✅ CORS configuration with whitelist
- ✅ Helmet security headers
- ✅ Production JWT secret validation

### Planned Enhancements
- 🔄 httpOnly cookies for token storage (instead of localStorage)
- 🔄 Per-user rate limiting
- 🔄 Refresh token rotation
- 🔄 OAuth integration (Google)
- 🔄 Two-factor authentication (2FA)

---

## API Architecture

### Route Structure
```
/api
├── /auth              # Authentication (login, register, reset)
├── /users             # User management
├── /courses           # Course CRUD
├── /lessons           # Lesson CRUD
├── /exercises         # Exercise CRUD
├── /progress          # Progress tracking
├── /flashcards        # Flashcard system
├── /groups            # Study groups
├── /forum             # Discussion forum
├── /chat              # Real-time chat
├── /admin             # Admin operations
├── /family            # Family linking
├── /billing           # Stripe integration
└── /push              # Push notifications
```

### Rate Limiting
- **Authentication**: 10 requests / 15 minutes
- **API**: 100 requests / 15 minutes
- **Chat**: 240 requests / 15 minutes

### Middleware Stack
1. Helmet (security headers)
2. CORS (origin validation)
3. express.json (body parsing)
4. mongoSanitize (injection prevention)
5. Rate limiters
6. Authentication middleware
7. Authorization middleware
8. Error handler

---

## Real-time Features (Socket.io)

### Events
- `connection` - User connects with JWT
- `conversation:join` - Join a chat conversation
- `message:send` - Send a chat message
- `message:new` - Receive new message
- `conversation:refresh` - Conversation updated
- `user:${userId}` - User-specific room for notifications

### Authentication
- JWT token passed in Socket.io handshake
- Token verified before connection established
- User joined to personal room for targeted notifications

---

## Deployment Architecture

### Current Setup
```
Frontend (GitHub Pages)
    ↓ HTTPS
Backend (Render)
    ↓
MongoDB Atlas
```

### Environment Variables (Backend)
```env
# Required
PORT=5000
NODE_ENV=production
MONGODB_URI=<atlas-uri>
JWT_SECRET=<256-bit-secret>
JWT_EXPIRE=7d
FRONTEND_URL=<frontend-domain>

# Optional
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
VAPID_PUBLIC_KEY=<key>
VAPID_PRIVATE_KEY=<key>
SMTP_HOST=<host>
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<pass>
EMAIL_FROM=<sender>
STRIPE_SECRET_KEY=<key>
STRIPE_WEBHOOK_SECRET=<secret>
```

---

## Future Roadmap

### Phase B: Enhanced Payments
- ✅ Stripe basic integration
- 🔄 Invoice generation with PDFs
- 🔄 Payme integration (Uzbekistan)
- 🔄 Click integration (Uzbekistan)
- 🔄 Background job processing (BullMQ)

### Phase C: Tutoring Marketplace
- 🔄 Tutor profile system
- 🔄 Availability calendar
- 🔄 Booking flow with payments
- 🔄 Session scheduling
- 🔄 Redis slot locking

### Phase D: Live Lessons
- 🔄 Agora WebRTC integration
- 🔄 Video conferencing
- 🔄 Interactive whiteboard
- 🔄 Session recording
- 🔄 Attendance tracking

### Phase E: Advanced Gamification
- 🔄 Achievement badges
- 🔄 Redis-cached leaderboards
- 🔄 Streak persistence
- 🔄 Daily challenges
- 🔄 Social features

### Phase F: Localization
- 🔄 Multi-language UI (i18n)
- 🔄 Localized course content
- 🔄 Translation workflow
- 🔄 RTL support

---

## Performance Optimizations

### Implemented
- ✅ Database indexing (16 indexes across collections)
- ✅ Native bcrypt (10x faster than bcryptjs)
- ✅ Connection pooling
- ✅ Gzip compression

### Planned
- 🔄 Redis caching for leaderboards
- 🔄 Redis session store
- 🔄 Query optimization and aggregation pipelines
- 🔄 Frontend code splitting
- 🔄 Lazy loading of routes
- 🔄 Image optimization and CDN
- 🔄 Static asset caching

---

## Monitoring & Observability

### Current
- ✅ Winston structured logging
- ✅ Development: Colorized console logs
- ✅ Production: JSON logs with file rotation
- ✅ Error stack traces
- ✅ Health check endpoint

### Planned
- 🔄 Sentry error tracking
- 🔄 APM (New Relic / DataDog)
- 🔄 Uptime monitoring
- 🔄 Log aggregation (ELK stack)
- 🔄 Performance metrics
- 🔄 User analytics

---

## Testing Strategy

### Backend (Current)
- Unit tests: Jest
- Integration tests: Supertest
- Coverage: ~20% (target: 70%)
- Test files: 4 (auth, billing, content validation, app)

### Frontend (Planned)
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright
- Coverage target: 70%

---

## Security Considerations

### Implemented
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT with production secret validation
- ✅ Hashed password reset tokens
- ✅ Email verification tokens (hashed)
- ✅ MongoDB injection prevention
- ✅ XSS protection
- ✅ CORS whitelist
- ✅ Rate limiting (per-IP)
- ✅ Security headers (Helmet)
- ✅ Input validation (express-validator)

### Planned
- 🔄 httpOnly cookie authentication
- 🔄 CSRF protection
- 🔄 Per-user rate limiting
- 🔄 Refresh token rotation
- 🔄 Secret rotation policy
- 🔄 Security audit logging
- 🔄 Penetration testing

---

## Migration Notes

### Recent Changes (2026-08)
1. **bcryptjs → bcrypt**: Migrated to native bcrypt for 10x performance improvement
2. **Logging**: Replaced console.log with Winston structured logging
3. **Database**: Added comprehensive MongoDB indexes
4. **Security**: Enhanced input sanitization and validation
5. **Dependencies**: Updated to latest stable versions

### Breaking Changes
- None (all changes backward compatible)

---

## Development Workflow

### Local Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Linting
npm run lint
```

### Database Seeding
```bash
cd backend
npm run seed
```

---

## Contact & Support

### Technical Stack Decision Rationale
- **MongoDB over PostgreSQL**: Flexibility for schema evolution, better fit for document-oriented user profiles and course content
- **Express over NestJS**: Simpler stack, faster iteration, adequate for current scale
- **Zustand over Redux**: Lighter weight, easier to use, sufficient for app state needs
- **Socket.io over ws**: Higher-level API, automatic reconnection, room support

### Future Considerations
- When to migrate to TypeScript backend: When team grows or codebase exceeds 50k LOC
- When to add Redis: When active user count exceeds 10k or leaderboard queries slow
- When to split microservices: When monolith deployment time exceeds 5 minutes

---

**Last Updated**: 2026-08-25  
**Current Version**: 1.0.0  
**Stack**: MERN (MongoDB, Express, React, Node.js)  
**Status**: Production-ready for beta testing
