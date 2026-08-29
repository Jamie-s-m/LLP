import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { hasModeratorPermission } from '../middleware/auth.js';

export const getLessons = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const filter = courseId ? { course: courseId } : {};
    const lessons = await Lesson.find(filter).sort({ order: 1 });
    res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    next(error);
  }
};

export const getLessonById = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('exercises');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // The populated exercises otherwise carry their answer key straight to the client -
    // strip it here for anyone who doesn't manage this lesson's course (mirrors
    // exerciseController's canManageLesson check without changing lesson.course's shape).
    const course = await Course.findById(lesson.course).select('instructor');
    const canSeeAnswers = req.user.role === 'admin'
      || hasModeratorPermission(req.user, 'catalogContentQa')
      || course?.instructor?.toString() === req.user.id.toString();

    if (!canSeeAnswers) {
      lesson.exercises.forEach((exercise) => {
        exercise.correctAnswer = undefined;
        exercise.correctAnswers = undefined;
        exercise.correctPairs = undefined;
      });
    }

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (req, res, next) => {
  try {
    const {
      courseId, title, content, order, difficulty, description,
      contentType, mediaUrl, vocabulary, grammar, duration, tags,
    } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (req.user.role !== 'admin' && !hasModeratorPermission(req.user, 'catalogContentQa') && course.instructor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    const lesson = await Lesson.create({
      course: courseId,
      title,
      content,
      order,
      difficulty,
      description,
      contentType,
      mediaUrl,
      vocabulary,
      grammar,
      duration,
      tags,
    });

    course.lessons.push(lesson._id);
    course.totalLessons = (course.totalLessons || 0) + 1;
    await course.save();

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

const assertLessonOwnership = async (lessonId, user) => {
  const lesson = await Lesson.findById(lessonId).populate('course', 'instructor');
  if (!lesson) return { error: { status: 404, message: 'Lesson not found' } };
  if (user.role !== 'admin' && !hasModeratorPermission(user, 'catalogContentQa') && lesson.course.instructor.toString() !== user.id.toString()) {
    return { error: { status: 403, message: 'You do not manage this course' } };
  }
  return { lesson };
};

export const updateLesson = async (req, res, next) => {
  try {
    const { lesson, error } = await assertLessonOwnership(req.params.id, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    Object.assign(lesson, req.body);
    await lesson.save();
    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

export const deleteLesson = async (req, res, next) => {
  try {
    const { lesson, error } = await assertLessonOwnership(req.params.id, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    await Lesson.findByIdAndDelete(lesson._id);
    await Course.findByIdAndUpdate(lesson.course._id, { $pull: { lessons: lesson._id }, $inc: { totalLessons: -1 } });
    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};
