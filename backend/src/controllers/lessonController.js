import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import { hasModeratorPermission, isOwnerId } from '../middleware/auth.js';
import { assertLessonOwnership } from '../utils/ownership.js';
import { requireLessonEntitlement } from '../utils/entitlement.js';

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
    const isManager = req.user.role === 'admin'
      || hasModeratorPermission(req.user, 'catalogContentQa')
      || isOwnerId(course?.instructor, req.user.id);

    // A course manager always sees their own full lesson regardless of their own billing
    // state - the paywall gates students, not the person who authored the content. Everyone
    // else past the free tier (Lesson.cefr 'A1', or the course's Lesson 1 regardless of level)
    // gets a shell: title/description/duration survive so the lesson still shows up in
    // navigation, but content/vocabulary/grammar/exercises are stripped - a locked preview,
    // not a blanket 403, mirroring the answer-key stripping pattern just above.
    if (!isManager && !requireLessonEntitlement(lesson, req.user).allowed) {
      return res.status(200).json({
        success: true,
        data: {
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          course: lesson.course,
          order: lesson.order,
          cefr: lesson.cefr,
          duration: lesson.duration,
          difficulty: lesson.difficulty,
          contentType: lesson.contentType,
        },
        meta: { locked: true, requiresUpgrade: true },
      });
    }

    const canSeeAnswers = isManager;
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
    if (req.user.role !== 'admin' && !hasModeratorPermission(req.user, 'catalogContentQa') && !isOwnerId(course.instructor, req.user.id)) {
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
    if (lesson.course) {
      await Course.findByIdAndUpdate(lesson.course._id, { $pull: { lessons: lesson._id }, $inc: { totalLessons: -1 } });
    }
    res.status(200).json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    next(error);
  }
};
