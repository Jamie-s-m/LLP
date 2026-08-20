import express from 'express';
import { protect } from '../middleware/auth.js';
import { getPosts, createPost, addReply } from '../controllers/forumController.js';

const router = express.Router();

router.get('/posts', getPosts);
router.post('/posts', protect, createPost);
router.post('/posts/:postId/replies', protect, addReply);

export default router;