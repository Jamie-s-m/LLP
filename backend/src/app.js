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
import { handleStripeWebhook } from './controllers/billingController.js';

dotenv.config();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://jamie-s-m.github.io',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin is not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
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

// Catch-all API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use(errorHandler);

export default app;