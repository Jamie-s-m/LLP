import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import exerciseRoutes from './routes/exercises.js';
import progressRoutes from './routes/progress.js';
import flashcardRoutes from './routes/flashcards.js';
import groupRoutes from './routes/groups.js';
import forumRoutes from './routes/forum.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import familyRoutes from './routes/family.js';
import billingRoutes from './routes/billing.js';
import pushRoutes from './routes/push.js';
import dailyRewardRoutes from './routes/dailyReward.js';
import gamificationRoutes from './routes/gamification.js';
import placementRoutes from './routes/placement.js';
import waitlistRoutes from './routes/waitlist.js';
import analyticsRoutes from './routes/analytics.js';
import certificateRoutes from './routes/certificates.js';
import debugRoutes from './routes/debug.js';
import assignmentRoutes from './routes/assignments.js';
import attendanceRoutes from './routes/attendance.js';

dotenv.config();

const app = express();

// Render sits in front of this app as a single reverse proxy and sets X-Forwarded-For to the
// real client IP. Without this, express-rate-limit can't trust that header at all (it throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR rather than silently misbehaving - confirmed in production
// logs) and every request would key rate limits off the same upstream address instead of the
// real client. `1` trusts exactly one hop, which is what Render's own proxy adds - not `true`,
// which would trust the whole header including any value a client tried to forge.
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const developmentOrigins = process.env.NODE_ENV === 'production' ? [] : [
  'http://localhost:5173',
  'http://localhost:3000',
];

const defaultOrigins = [
  ...developmentOrigins,
  'https://lingua-nest.onrender.com',
  'https://linguanest.uz',
  'https://www.linguanest.uz',
  'https://api.linguanest.uz',
  'https://www.api.linguanest.uz',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_APP_URL,
];

const normalizeOrigin = (value) => (typeof value === 'string' ? value.replace(/\/+$/, '').toLowerCase() : '');
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
    .concat(defaultOrigins.filter(Boolean).map(normalizeOrigin))
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      if (allowedOrigins.has(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  if (value && typeof value === 'object') {
    const sanitized = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }

      sanitized[key] = sanitizeObject(nestedValue);
    }

    return sanitized;
  }

  return value;
};

app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
});

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const chatLimiter = rateLimit({
  windowMs: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || 240),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Chat is busy right now. Please retry in a moment.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running successfully' });
});

app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/daily-reward', dailyRewardRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/placement', placementRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);

// Catch-all API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use(errorHandler);

export default app;