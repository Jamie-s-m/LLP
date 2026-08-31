import express from 'express';
import { protect, authorize, authorizeRoleOrPermission } from '../middleware/auth.js';
import { getUsers, updateUser, deleteUser, bulkUserAction, getOverview, getContentHealth, listContent, createContent, updateContent, deleteContent, bulkUpdateContent, bulkDeleteContent, listTeacherApplications, reviewTeacherApplication, sendTestPush, resetPlatform } from '../controllers/adminController.js';
import { getBusinessMetrics, getUserSegment } from '../controllers/businessMetricsController.js';

const router = express.Router();
router.use(protect);
router.get('/overview', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'supportChat', 'catalogContentQa', 'limitedUserManagement'] }), getOverview);
// Admin-only, not shared with moderators - revenue and per-user contact data, unlike the
// operational counts in /overview.
router.get('/business-metrics', authorize('admin'), getBusinessMetrics);
router.get('/business-metrics/segment', authorize('admin'), getUserSegment);
router.get('/users', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), getUsers);
router.post('/users/bulk-action', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), bulkUserAction);
router.patch('/users/:id', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), updateUser);
router.delete('/users/:id', authorize('admin'), deleteUser);
router.post('/reset-platform', authorize('admin'), resetPlatform);
router.get('/teacher-applications', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['limitedUserManagement'] }), listTeacherApplications);
// Admin-only, not limitedUserManagement: approving grants the 'teacher' role, a bigger
// privilege change than the suspend/reactivate actions that permission scope is meant to cover
// (updateUser explicitly blocks limited moderators from changing anyone's role - this matches).
router.patch('/teacher-applications/:id', authorize('admin'), reviewTeacherApplication);
router.get('/content/health', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['catalogContentQa'] }), getContentHealth);
router.get('/content/:resource', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), listContent);
router.post('/content/:resource', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), createContent);
router.patch('/content/:resource/bulk', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), bulkUpdateContent);
router.post('/content/:resource/bulk-delete', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), bulkDeleteContent);
router.patch('/content/:resource/:id', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), updateContent);
router.delete('/content/:resource/:id', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['communityModeration', 'catalogContentQa'] }), deleteContent);

// Admin push send (test)
router.post('/push/send', authorizeRoleOrPermission({ roles: ['admin'], permissions: ['supportChat'] }), async (req, res, next) => {
  try {
    await sendTestPush(req, res, next);
  } catch (err) { next(err); }
});

export default router;
