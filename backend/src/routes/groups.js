import express from 'express';
import { protect } from '../middleware/auth.js';
import { getGroups, createGroup, joinGroup, approveJoinRequest, rejectJoinRequest } from '../controllers/groupController.js';

const router = express.Router();

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.post('/:id/join', protect, joinGroup);
router.post('/:id/requests/:userId/approve', protect, approveJoinRequest);
router.post('/:id/requests/:userId/reject', protect, rejectJoinRequest);

export default router;