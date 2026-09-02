import User from '../models/User.js';
import Course from '../models/Course.js';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import logger from './logger.js';

export const createIndexes = async () => {
  try {
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ emailVerificationToken: 1 });
    await User.collection.createIndex({ passwordResetToken: 1 });
    await User.collection.createIndex({ 'billing.paymeTransactionId': 1 });
    await User.collection.createIndex({ 'billing.clickTransactionId': 1 });
    await User.collection.createIndex({ createdAt: -1 });

    await Course.collection.createIndex({ isPublished: 1, createdAt: -1 });
    await Course.collection.createIndex({ instructor: 1 });
    await Course.collection.createIndex({ language: 1 });
    await Course.collection.createIndex({ difficulty: 1 });

    await ChatConversation.collection.createIndex({ participants: 1 });
    await ChatConversation.collection.createIndex({ lastMessageAt: -1 });

    await ChatMessage.collection.createIndex({ conversation: 1, createdAt: -1 });
    await ChatMessage.collection.createIndex({ sender: 1 });
    await ChatMessage.collection.createIndex({ readBy: 1 });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};
