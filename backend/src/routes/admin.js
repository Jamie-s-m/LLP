import express from 'express';
import { protect, authorize, authorizeRoleOrPermission } from '../middleware/auth.js';
import { getUsers, updateUser, deleteUser, getOverview, listContent, createContent, updateContent, deleteContent, listTeacherApplications, reviewTeacherApplication } from '../controllers/adminController.js';

const router = express.Router();
router.use(protect);
router.get('/overview', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'supportChat', 'catalogContentQa', 'limitedUserManagement'] }), getOverview);
router.get('/users', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), getUsers);
router.patch('/users/:id', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), updateUser);
router.delete('/users/:id', authorize('admin'), deleteUser);
router.get('/teacher-applications', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), listTeacherApplications);
router.patch('/teacher-applications/:id', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), reviewTeacherApplication);
router.get('/content/:resource', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), listContent);
router.post('/content/:resource', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), createContent);
router.patch('/content/:resource/:id', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), updateContent);
router.delete('/content/:resource/:id', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), deleteContent);

export default router;
