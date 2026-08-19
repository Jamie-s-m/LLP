import User from '../models/User.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Flashcard from '../models/Flashcard.js';
import ForumPost from '../models/ForumPost.js';
import Group from '../models/Group.js';

const contentModels = { courses: Course, lessons: Lesson, flashcards: Flashcard, posts: ForumPost, groups: Group };

const getContentModel = (resource) => contentModels[resource];

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) { next(error); }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const allowed = ['firstName', 'lastName', 'role', 'isActive', 'isEmailVerified'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) user[field] = req.body[field]; });
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

export const getOverview = async (req, res, next) => {
  try {
    const [users, courses, lessons, flashcards, posts] = await Promise.all([
      User.countDocuments(), Course.countDocuments(), Lesson.countDocuments(), Flashcard.countDocuments(), ForumPost.countDocuments(),
    ]);
    res.status(200).json({ success: true, data: { users, courses, lessons, flashcards, posts } });
  } catch (error) { next(error); }
};

export const listContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    const items = await Model.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const createContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    const item = await Model.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const updateContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Content item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const deleteContent = async (req, res, next) => {
  try {
    const Model = getContentModel(req.params.resource);
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content resource' });
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Content item not found' });
    res.status(200).json({ success: true, message: 'Content item deleted' });
  } catch (error) { next(error); }
};
