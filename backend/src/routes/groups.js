import express from 'express';
import { protect } from '../middleware/auth.js';
import { getGroups, createGroup, joinGroup } from '../controllers/groupController.js';

const router = express.Router();

router.get('/', protect, getGroups);
router.post('/', protect, createGroup);
router.post('/:id/join', protect, joinGroup);

export default router;