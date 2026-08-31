import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import ExerciseAttempt from '../models/ExerciseAttempt.js';
import { SKILLS } from '../utils/skills.js';

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

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId }).select('_id');
    if (!lesson) {
      return res.status(400).json({ success: false, message: 'Lesson does not belong to this course' });
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

// @desc    Get a student's progress across the requesting teacher's own courses
// @route   GET /api/progress/student/:studentId
// @access  Private (Teacher/Admin)
export const getStudentProgressForTeacher = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const courseFilter = req.user.role === 'admin' ? {} : { instructor: req.user.id };
    const myCourseIds = (await Course.find(courseFilter).select('_id')).map((course) => course._id);

    const progressRecords = await Progress.find({ user: studentId, course: { $in: myCourseIds } })
      .populate('course', 'title language level')
      .populate('user', 'firstName lastName email xp streak');

    if (progressRecords.length === 0) {
      return res.status(404).json({ success: false, message: 'No progress records found for this student in your courses' });
    }

    res.status(200).json({
      success: true,
      data: {
        student: progressRecords[0].user,
        courses: progressRecords.map((record) => ({
          courseId: record.course._id,
          title: record.course.title,
          progressPercentage: record.progressPercentage,
          isCompleted: record.isCompleted,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Per-skill accuracy/volume breakdown for the Progress & Analytics page, aggregated
//          from the ExerciseAttempt log (real data, not the mockup's invented skill scores).
// @route   GET /api/progress/skills-breakdown
// @access  Private
export const getSkillsBreakdown = async (req, res, next) => {
  try {
    const rows = await ExerciseAttempt.aggregate([
      { $match: { user: req.user._id, status: 'graded' } },
      {
        $group: {
          _id: '$skill',
          attempts: { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        },
      },
    ]);

    const bySkill = new Map(rows.map((row) => [row._id, row]));
    const breakdown = SKILLS.map((skill) => {
      const row = bySkill.get(skill);
      const attempts = row?.attempts || 0;
      const correct = row?.correct || 0;
      return {
        skill,
        attempts,
        correct,
        accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
      };
    });

    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    next(error);
  }
};

// PRIORITY 9/85: a real per-skill profile instead of one percentage. Deliberately does NOT
// invent a separate CEFR letter per skill from the placement test's per-skill counts (e.g.
// "Grammar: B1, Vocabulary: A2") - the placement test's skill-tagged items span every CEFR
// tier mixed together, so a blended accuracy ratio per skill is not a valid tier estimate on
// its own (that needs a properly designed adaptive/IRT instrument - PRIORITY 84/141 explicitly
// warn against implying that precision before it exists). Instead: ONE overall CEFR estimate
// (from the real tier-gated placement result, which IS designed to support that), reported
// with an honest confidence level, plus per-skill ACCURACY (not a fake CEFR letter) from both
// the placement test and ongoing practice.
export const getSkillProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('placementLevel placementCefr placementSkillStats placementCompletedAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const practiceRows = await ExerciseAttempt.aggregate([
      { $match: { user: req.user._id, status: 'graded' } },
      { $group: { _id: '$skill', attempts: { $sum: 1 }, correct: { $sum: { $cond: ['$isCorrect', 1, 0] } } } },
    ]);
    const practiceBySkill = new Map(practiceRows.map((row) => [row._id, row]));

    const PLACEMENT_COVERED_SKILLS = new Set(['grammar', 'vocabulary', 'reading']);
    const skills = SKILLS.map((skill) => {
      const practice = practiceBySkill.get(skill);
      const practiceAccuracy = practice?.attempts ? Math.round((practice.correct / practice.attempts) * 100) : null;

      const placementStat = PLACEMENT_COVERED_SKILLS.has(skill) ? user.placementSkillStats?.[skill] : null;
      const placementAccuracy = placementStat?.total ? Math.round((placementStat.correct / placementStat.total) * 100) : null;

      return {
        skill,
        placement: placementStat?.total
          ? { accuracyPercent: placementAccuracy, questionCount: placementStat.total }
          : { accuracyPercent: null, questionCount: 0, note: PLACEMENT_COVERED_SKILLS.has(skill) ? 'no placement data yet' : 'not covered by the placement test yet' },
        practice: practice?.attempts
          ? { accuracyPercent: practiceAccuracy, attemptCount: practice.attempts }
          : { accuracyPercent: null, attemptCount: 0 },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        overallCefr: user.placementCefr,
        overallLevel: user.placementLevel,
        confidence: user.placementCompletedAt ? 'low' : 'none',
        confidenceNote: user.placementCompletedAt
          ? 'Based on a single 32-question placement test, not an ongoing adaptive assessment. Treat as a starting estimate, not a precise measurement.'
          : 'No placement test completed yet.',
        skills,
      },
    });
  } catch (error) {
    next(error);
  }
};