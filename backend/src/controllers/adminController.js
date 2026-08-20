import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Flashcard from '../models/Flashcard.js';
import ForumPost from '../models/ForumPost.js';
import Group from '../models/Group.js';
import FamilyLink from '../models/FamilyLink.js';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import Progress from '../models/Progress.js';
import { defaultModeratorPermissions, hasModeratorPermission, normalizeModeratorPermissions } from '../middleware/auth.js';

const contentModels = { courses: Course, lessons: Lesson, flashcards: Flashcard, posts: ForumPost, groups: Group };

const getContentModel = (resource) => contentModels[resource];
const communityResources = new Set(['posts', 'groups']);
const catalogResources = new Set(['courses', 'lessons', 'flashcards']);
const canManageResource = (user, resource) =>
  user.role === 'admin' ||
  (communityResources.has(resource) && hasModeratorPermission(user, 'communityModeration')) ||
  (catalogResources.has(resource) && hasModeratorPermission(user, 'catalogContentQa'));

export const getUsers = async (req, res, next) => {
  try {
    const filter = hasModeratorPermission(req.user, 'limitedUserManagement') && req.user.role !== 'admin'
      ? { role: { $nin: ['admin', 'moderator'] } }
      : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) { next(error); }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const actorIsAdmin = req.user.role === 'admin';
    const actorIsLimitedModerator = hasModeratorPermission(req.user, 'limitedUserManagement') && req.user.role === 'moderator';

    if (actorIsLimitedModerator && ['admin', 'moderator'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Moderators cannot manage admin or moderator accounts' });
    }

    if (req.params.id === req.user.id.toString()) {
      if (req.body.role && req.body.role !== req.user.role) {
        return res.status(400).json({ success: false, message: 'You cannot change your own primary role from this screen' });
      }
      if (req.body.isActive === false) {
        return res.status(400).json({ success: false, message: 'You cannot suspend your own account' });
      }
    }

    if (actorIsAdmin) {
      const allowed = ['firstName', 'lastName', 'role', 'isActive', 'isEmailVerified'];
      allowed.forEach((field) => { if (req.body[field] !== undefined) user[field] = req.body[field]; });
      if (req.body.role !== undefined && req.body.role !== 'moderator') {
        user.moderatorPermissions = defaultModeratorPermissions();
      }
      if ((req.body.role === 'moderator' || user.role === 'moderator') && req.body.moderatorPermissions !== undefined) {
        user.moderatorPermissions = normalizeModeratorPermissions(req.body.moderatorPermissions);
      }
    } else if (actorIsLimitedModerator) {
      if (req.body.isActive === undefined || Object.keys(req.body).some((key) => key !== 'isActive')) {
        return res.status(403).json({ success: false, message: 'Moderators can only suspend or reactivate users' });
      }
      user.isActive = Boolean(req.body.isActive);
    }

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id.toString()) return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};

export const listTeacherApplications = async (req, res, next) => {
  try {
    const applicants = await User.find({ teacherApplicationStatus: 'pending' }).select('-password').sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: applicants });
  } catch (error) { next(error); }
};

export const reviewTeacherApplication = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.teacherApplicationStatus !== 'pending') {
      return res.status(404).json({ success: false, message: 'Teacher application not found' });
    }
    if (req.body.approve) {
      user.role = 'teacher';
      user.teacherApplicationStatus = 'approved';
    } else {
      user.teacherApplicationStatus = 'rejected';
    }
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const getOverview = async (req, res, next) => {
  try {
    const [users, students, teachers, parents, moderators, admins, courses, publishedCourses, lessons, flashcards, posts, pinnedPosts, groups, pendingTeacherApplications, approvedFamilyLinks, chatConversations, chatMessages, enrollments, completedEnrollments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'parent' }),
      User.countDocuments({ role: 'moderator' }),
      User.countDocuments({ role: 'admin' }),
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Lesson.countDocuments(),
      Flashcard.countDocuments(),
      ForumPost.countDocuments(),
      ForumPost.countDocuments({ isPinned: true }),
      Group.countDocuments(),
      User.countDocuments({ teacherApplicationStatus: 'pending' }),
      FamilyLink.countDocuments({ status: 'approved' }),
      ChatConversation.countDocuments(),
      ChatMessage.countDocuments(),
      Progress.countDocuments(),
      Progress.countDocuments({ isCompleted: true }),
    ]);
    res.status(200).json({
      success: true,
      data: {
        totals: { users, students, teachers, parents, moderators, admins, courses, publishedCourses, lessons, flashcards, posts, pinnedPosts, groups, pendingTeacherApplications, approvedFamilyLinks, chatConversations, chatMessages, enrollments, completedEnrollments },
      },
    });
  } catch (error) { next(error); }
};

export const listContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    if (!canManageResource(req.user, req.params.resource)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to manage this content resource' });
    }
    const items = await Model.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const createContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    if (!canManageResource(req.user, req.params.resource)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to manage this content resource' });
    }
    const payload = { ...req.body };
    if (req.params.resource === 'posts') payload.author = req.user.id;
    if (req.params.resource === 'groups') {
      payload.creator = payload.creator || req.user.id;
      payload.members = Array.isArray(payload.members) && payload.members.length > 0 ? payload.members : [req.user.id];
      payload.moderators = Array.isArray(payload.moderators) && payload.moderators.length > 0 ? payload.moderators : [req.user.id];
    }
    const item = await Model.create(payload);
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const updateContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    if (!canManageResource(req.user, req.params.resource)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to manage this content resource' });
    }
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Content item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const deleteContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    if (!canManageResource(req.user, req.params.resource)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to manage this content resource' });
    }
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Content item not found' });
    res.status(200).json({ success: true, message: 'Content item deleted' });
  } catch (error) { next(error); }
};
