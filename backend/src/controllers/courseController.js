import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import { hasModeratorPermission } from '../middleware/auth.js';

const canManageCourse = (course, user) =>
  user.role === 'admin' ||
  hasModeratorPermission(user, 'catalogContentQa') ||
  course.instructor.toString() === user.id.toString();

export const getCourses = async (req, res, next) => {
  try {
    const { language, level, limit } = req.query;
    const filter = { isPublished: true };

    if (language) filter.language = language;
    if (level) filter.level = level;

    const query = Course.find(filter).populate('instructor', 'firstName lastName email role');
    const courses = limit ? await query.limit(Number(limit)) : await query;

    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = await Course.findOne({ _id: req.params.id, isPublished: true }).populate('instructor', 'firstName lastName email role');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const lessons = await Lesson.find({ course: req.params.id }).sort({ order: 1 });
    res.status(200).json({ success: true, data: { course, lessons } });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, language, level, category, thumbnail, estimatedHours } = req.body;

    if (!title || !description || !language || !level || !category) {
      return res.status(400).json({ success: false, message: 'Missing required course fields' });
    }

    const course = await Course.create({
      title,
      description,
      language,
      level,
      category,
      thumbnail,
      estimatedHours,
      instructor: req.user.id,
      isPublished: true,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    const allowedFields = ['title', 'description', 'language', 'level', 'category', 'thumbnail', 'estimatedHours', 'isPublished'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) course[field] = req.body[field];
    });
    await course.save();

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }
    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

export const getMyCourseOverview = async (req, res, next) => {
  try {
    const myCourses = await Course.find({ instructor: req.user.id }).select('_id rating isPublished');
    const courseIds = myCourses.map((course) => course._id);

    const totalStudents = courseIds.length > 0
      ? (await Progress.distinct('user', { course: { $in: courseIds } })).length
      : 0;

    const avgRating = myCourses.length > 0
      ? Math.round((myCourses.reduce((sum, course) => sum + (course.rating || 0), 0) / myCourses.length) * 10) / 10
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalCourses: myCourses.length,
        publishedCourses: myCourses.filter((course) => course.isPublished).length,
        totalStudents,
        avgRating,
      },
    });
  } catch (error) {
    next(error);
  }
};
