import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getUsers, updateUser, deleteUser, getOverview, listContent, createContent, updateContent, deleteContent, listTeacherApplications, reviewTeacherApplication } from '../controllers/adminController.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/overview', getOverview);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/teacher-applications', listTeacherApplications);
router.patch('/teacher-applications/:id', reviewTeacherApplication);
router.get('/content/:resource', listContent);
router.post('/content/:resource', createContent);
router.patch('/content/:resource/:id', updateContent);
router.delete('/content/:resource/:id', deleteContent);

export default router;
