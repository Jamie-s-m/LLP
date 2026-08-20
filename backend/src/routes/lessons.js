import express from 'express';
import { protect, authorizeRoleOrPermission } from '../middleware/auth.js';
import { getLessons, getLessonById, createLesson, updateLesson, deleteLesson } from '../controllers/lessonController.js';

const router = express.Router();

router.get('/', protect, getLessons);
router.get('/:id', protect, getLessonById);
router.post('/', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), createLesson);
router.put('/:id', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), updateLesson);
router.delete('/:id', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), deleteLesson);

export default router;