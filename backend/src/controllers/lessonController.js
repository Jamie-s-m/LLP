import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

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

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

export const createLesson = async (req, res, next) => {
  try {
    const { courseId, title, content, order, difficulty, description } = req.body;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const lesson = await Lesson.create({
      course: courseId,
      title,
      content,
      order,
      difficulty,
      description,
    });

    course.lessons.push(lesson._id);
    course.totalLessons = (course.totalLessons || 0) + 1;
    await course.save();

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};
