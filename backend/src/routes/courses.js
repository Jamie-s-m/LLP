import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, getMyCourses, getMyCourseOverview } from '../controllers/courseController.js';

const router = express.Router();

router.get('/mine', protect, authorize('teacher', 'admin'), getMyCourses);
router.get('/mine/overview', protect, authorize('teacher', 'admin'), getMyCourseOverview);
router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('teacher', 'admin'), createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);

export default router;