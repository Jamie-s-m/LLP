import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import ChatConversation from './models/ChatConversation.js';
import ChatMessage from './models/ChatMessage.js';
import { sendPushToUsers } from './utils/push.js';

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
    console.log(`MongoDB connected: ${mongoose.connection.host}`);

    const server = createServer(app);
    const io = new Server(server, {
      cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
    });

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
          const message = await ChatMessage.create({ conversation: conversationId, sender: socket.user.id, body: String(body).trim() });
          conversation.lastMessageAt = new Date();
          await conversation.save();
          const populated = await message.populate('sender', 'firstName lastName role avatar');
          io.to(conversationId).emit('message:new', populated);

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
      console.log(`API listening on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Unable to start API:', error.message);
    process.exit(1);
  }
};

startServer();