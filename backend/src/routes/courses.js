import express from 'express';
import { protect, authorize, authorizeRoleOrPermission } from '../middleware/auth.js';
import {
  getCourses,
  getAllCoursesForAdmin,
  getCourseById,
  getCourseForManage,
  getCourseStudents,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  getMyCourseOverview,
} from '../controllers/courseController.js';

const router = express.Router();

router.get('/mine', protect, authorize('teacher', 'admin'), getMyCourses);
router.get('/mine/overview', protect, authorize('teacher', 'admin'), getMyCourseOverview);
router.get('/admin/all', protect, authorizeRoleOrPermission({ roles: ['admin'], permissions: ['catalogContentQa'] }), getAllCoursesForAdmin);
router.get('/:id/manage', protect, authorize('teacher', 'admin'), getCourseForManage);
router.get('/:id/students', protect, authorize('teacher', 'admin'), getCourseStudents);
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), createCourse);
router.put('/:id', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), updateCourse);
router.delete('/:id', protect, authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] }), deleteCourse);

export default router;