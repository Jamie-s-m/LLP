import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  listConversations,
  createConversation,
  listMessages,
  sendMessage,
  searchChatUsers,
} from '../controllers/chatController.js';

const router = express.Router();

router.use(protect);
router.get('/users', searchChatUsers);
router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id/messages', listMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;
