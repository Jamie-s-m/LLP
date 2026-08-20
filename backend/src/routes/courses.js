import express from 'express';
import { protect, authorize, authorizeRoleOrPermission } from '../middleware/auth.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, getMyCourses, getMyCourseOverview } from '../controllers/courseController.js';

const router = express.Router();

router.get('/mine', protect, authorize('teacher', 'admin'), getMyCourses);
router.get('/mine/overview', protect, authorize('teacher', 'admin'), getMyCourseOverview);
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), createCourse);
router.put('/:id', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), updateCourse);
router.delete('/:id', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), deleteCourse);

export default router;