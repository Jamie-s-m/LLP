import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import ChatConversation from './models/ChatConversation.js';
import ChatMessage from './models/ChatMessage.js';
import { sendPushToUsers } from './utils/push.js';
import logger from './utils/logger.js';
import { createIndexes } from './utils/indexes.js';
import { connectRedis, disconnectRedis } from './utils/redis.js';

dotenv.config();

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI;

if (process.env.NODE_ENV === 'production' && (!MONGODB_URI || !process.env.JWT_SECRET)) {
  throw new Error('MONGODB_URI and JWT_SECRET must be configured in production');
}

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI must be configured before starting the API');
}

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);

    await createIndexes();
    await connectRedis();

    const server = createServer(app);
    const developmentSocketOrigins = process.env.NODE_ENV === 'production' ? [] : [
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    const socketOrigins = [...new Set([
      process.env.FRONTEND_URL,
      process.env.FRONTEND_APP_URL,
      ...developmentSocketOrigins,
      'https://linguanest.uz',
      'https://www.linguanest.uz',
      'https://api.linguanest.uz',
      ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
    ].filter(Boolean))];

    const io = new Server(server, {
      cors: {
        origin: socketOrigins,
        credentials: true,
      },
    });
    app.set('io', io);

    io.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        socket.user = jwt.verify(token, process.env.JWT_SECRET || 'local-development-only-secret');
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    io.on('connection', (socket) => {
      socket.join(`user:${socket.user.id}`);

      socket.on('conversation:join', async (conversationId, acknowledge) => {
        const conversation = await ChatConversation.findOne({ _id: conversationId, participants: socket.user.id });
        if (!conversation) return acknowledge?.({ success: false, message: 'Conversation not found' });
        socket.join(conversationId);
        acknowledge?.({ success: true });
      });

      socket.on('message:send', async ({ conversationId, body }, acknowledge) => {
        try {
          const conversation = await ChatConversation.findOne({ _id: conversationId, participants: socket.user.id });
          if (!conversation || !String(body || '').trim()) return acknowledge?.({ success: false, message: 'Invalid message' });
          const message = await ChatMessage.create({
            conversation: conversationId,
            sender: socket.user.id,
            body: String(body).trim(),
            readBy: [socket.user.id],
          });
          conversation.lastMessageAt = new Date();
          await conversation.save();
          const populated = await message.populate('sender', 'firstName lastName role avatar');
          io.to(conversationId).emit('message:new', populated);
          conversation.participants.forEach((participantId) => {
            io.to(`user:${participantId.toString()}`).emit('conversation:refresh', { conversationId: conversationId.toString() });
          });

          const recipients = conversation.participants.filter((participantId) => participantId.toString() !== socket.user.id.toString());
          sendPushToUsers(recipients, {
            title: `New message from ${populated.sender.firstName}`,
            body: String(body).trim().slice(0, 120),
            url: '/chat',
          }).catch(() => {});

          acknowledge?.({ success: true });
        } catch (error) {
          acknowledge?.({ success: false, message: 'Message could not be sent' });
        }
      });
    });

    server.listen(PORT, () => {
      logger.info(`API listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectRedis();
        await mongoose.connection.close();
        logger.info('Server shutdown complete');
        process.exit(0);
      });
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Unable to start API:', error);
    process.exit(1);
  }
};

startServer();