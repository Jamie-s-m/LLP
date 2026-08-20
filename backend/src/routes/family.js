import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listFamilyLinks, requestFamilyLink, reviewFamilyLink, getChildrenProgress, getChildDetail } from '../controllers/familyController.js';

const router = express.Router();
router.use(protect);
router.get('/', authorize('parent', 'student', 'admin'), listFamilyLinks);
router.post('/', authorize('parent'), requestFamilyLink);
router.patch('/:id/review', authorize('student', 'admin', 'moderator'), reviewFamilyLink);
router.get('/children-progress', authorize('parent'), getChildrenProgress);
router.get('/children/:studentId', authorize('parent'), getChildDetail);

export default router;
