import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// @desc    Enroll student in a course
// @route   POST /api/progress/enroll/:courseId
// @access  Private (Student)
export const enrollCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check existing enrollment
    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (progress) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    progress = await Progress.create({
      user: userId,
      course: courseId,
      completedLessons: [],
      progressPercentage: 0,
    });

    res.status(201).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a lesson as completed & update XP / Streak
// @route   POST /api/progress/complete-lesson
// @access  Private (Student)
export const completeLesson = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;
    const userId = req.user.id;

    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }

    // Add lesson if not already completed
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);

      // Fetch course to calculate percentage
      const course = await Course.findById(courseId).populate('lessons');
      const totalLessons = course?.lessons?.length || 1;

      progress.progressPercentage = Math.round(
        (progress.completedLessons.length / totalLessons) * 100
      );

      if (progress.progressPercentage >= 100) {
        progress.isCompleted = true;
      }

      progress.lastAccessedAt = new Date();
      await progress.save();

      // Award XP & Update Streak on User
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + 50;

        const now = new Date();
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

        if (!lastActive) {
          user.streak = 1;
        } else {
          const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 3600);
          if (diffInHours >= 24 && diffInHours < 48) {
            user.streak += 1;
          } else if (diffInHours >= 48) {
            user.streak = 1;
          }
        }

        user.lastActiveDate = now;
        await user.save();
      }
    }

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's enrolled courses and progress
// @route   GET /api/progress/my-learning
// @access  Private
export const getMyLearning = async (req, res, next) => {
  try {
    const progressList = await Progress.find({ user: req.user.id })
      .populate('course')
      .populate('completedLessons');

    res.status(200).json({ success: true, data: progressList });
  } catch (error) {
    next(error);
  }
};