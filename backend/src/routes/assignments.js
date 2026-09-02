import express from 'express';
import { protect, authorizeRoleOrPermission } from '../middleware/auth.js';
import {
  createAssignment,
  getAssignmentsForCourse,
  getAssignmentById,
  getMyAssignments,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController.js';

const router = express.Router();
const manageAuth = authorizeRoleOrPermission({ roles: ['teacher', 'admin'], permissions: ['catalogContentQa'] });

// GET /mine and GET /course/:courseId must come before GET /:id, or Express matches
// "mine"/"course" as the :id param.
router.get('/mine', protect, getMyAssignments);
router.get('/course/:courseId', protect, manageAuth, getAssignmentsForCourse);
router.post('/', protect, manageAuth, createAssignment);
router.get('/:id', protect, manageAuth, getAssignmentById);
router.put('/:id', protect, manageAuth, updateAssignment);
router.delete('/:id', protect, manageAuth, deleteAssignment);

export default router;
