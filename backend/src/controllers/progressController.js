import Progress from '../models/Progress.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import ExerciseAttempt from '../models/ExerciseAttempt.js';
import Flashcard from '../models/Flashcard.js';
import { SKILLS } from '../utils/skills.js';
import { computeSkillMastery } from '../utils/masteryEngine.js';
import { filterDueFlashcards, filterAccessibleFlashcards } from './flashcardController.js';
import { hasModeratorPermission, isOwnerId } from '../middleware/auth.js';

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

// @desc    Class-wide view for one course: every enrolled student's completion plus their
//          per-skill mastery, so a teacher can see who's behind without opening each student
//          individually. Deliberately reuses computeSkillMastery (Phase 6) per student rather
//          than a second, differently-shaped aggregation path.
// @route   GET /api/progress/class-analytics/:courseId
// @access  Private (the course's own instructor, or admin/catalogContentQa)
export const getClassAnalyticsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('instructor title');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isManager = req.user.role === 'admin'
      || hasModeratorPermission(req.user, 'catalogContentQa')
      || isOwnerId(course.instructor, req.user.id);
    if (!isManager) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    const progressRecords = await Progress.find({ course: courseId }).populate('user', 'firstName lastName email');

    // A skill only counts as a real gap once it has real exercises in this course - same
    // reasoning as progressController.getTodayRecommendation's weak-skill filter, so a
    // "needs attention" flag never points at a skill this course couldn't have offered anyway.
    const NEEDS_ATTENTION_STATES = new Set(['needs_review', 'not_started', 'introduced', 'practicing']);

    const students = await Promise.all(
      progressRecords
        .filter((progress) => progress.user)
        .map(async (progress) => {
          const skillMastery = await computeSkillMastery(progress.user._id, courseId);
          const weakSkillCount = (skillMastery || [])
            .filter((entry) => NEEDS_ATTENTION_STATES.has(entry.state) && entry.totalExercises > 0)
            .length;

          return {
            studentId: progress.user._id,
            name: `${progress.user.firstName} ${progress.user.lastName}`,
            completionPercentage: progress.progressPercentage,
            isCompleted: progress.isCompleted,
            skillMastery: skillMastery || [],
            weakSkillCount,
          };
        })
    );

    const classAverageCompletion = students.length > 0
      ? Math.round(students.reduce((sum, student) => sum + student.completionPercentage, 0) / students.length)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        courseId: course._id,
        courseTitle: course.title,
        studentCount: students.length,
        classAverageCompletion,
        students,
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

// Skill states worth surfacing as "what to work on", ordered by urgency: 'needs_review' is an
// active regression/decay signal (see masteryEngine.js's applyRecencyDecay) - something the
// learner already had and is now losing, the most actionable kind of weak. The rest are
// ordered from "haven't touched it yet in this course" down to "closest to proficient" -
// each is a real gap, but not touched at all gets priority over partial progress. Deliberately
// excludes 'proficient'/'mastered' (see masteryEngine.js's PROFICIENT_STATES) - those aren't gaps.
const WEAK_SKILL_PRIORITY = ['needs_review', 'not_started', 'introduced', 'practicing', 'developing'];

// @desc    "What should I do today" - combines the in-progress lesson to continue, the
//          weakest skill in that same course, and how many flashcards are overdue for
//          review, so the Dashboard can recommend one concrete next action instead of a
//          static hero block.
// @route   GET /api/progress/today
// @access  Private
export const getTodayRecommendation = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Most recently touched course that isn't finished yet. lastAccessedAt is only set once a
    // lesson is completed (see completeLesson above) - a course the learner enrolled in but
    // never opened sorts after any course they've actually engaged with, which is the right
    // course to recommend continuing.
    const activeProgress = await Progress.findOne({ user: userId, isCompleted: { $ne: true } })
      .sort({ lastAccessedAt: -1 })
      .populate('course', 'title');

    let continueLesson = null;
    let weakestSkill = null;

    if (activeProgress?.course) {
      const course = activeProgress.course;
      const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 }).select('title cefr order');
      const completedSet = new Set((activeProgress.completedLessons || []).map((id) => String(id)));
      const nextLesson = lessons.find((lesson) => !completedSet.has(String(lesson._id)));

      if (nextLesson) {
        continueLesson = {
          lessonId: nextLesson._id,
          courseId: course._id,
          courseTitle: course.title,
          lessonTitle: nextLesson.title,
          cefr: nextLesson.cefr || null,
        };
      }

      const skillMastery = await computeSkillMastery(userId, course._id);
      // totalExercises > 0 matters here: a skill with zero exercises in this course is
      // trivially 'not_started' but there's nothing to actually recommend practicing - only
      // consider skills the course can genuinely offer the learner something for.
      const weakCandidates = (skillMastery || []).filter(
        (entry) => WEAK_SKILL_PRIORITY.includes(entry.state) && entry.totalExercises > 0
      );
      weakCandidates.sort((a, b) => {
        const priorityDiff = WEAK_SKILL_PRIORITY.indexOf(a.state) - WEAK_SKILL_PRIORITY.indexOf(b.state);
        return priorityDiff !== 0 ? priorityDiff : a.attemptCount - b.attemptCount;
      });

      if (weakCandidates.length > 0) {
        weakestSkill = { skill: weakCandidates[0].skill, state: weakCandidates[0].state, courseId: course._id };
      }
    }

    // Platform-wide, same scope getFlashcards uses with no courseId - this project's decks
    // aren't presented as course-scoped from the learner's side. Filtered to what the learner
    // can actually access first, so this count never promises a card a free plan can't open.
    const allFlashcards = await Flashcard.find().select('_id course');
    const accessibleFlashcards = await filterAccessibleFlashcards(allFlashcards, req.user);
    const dueFlashcards = await filterDueFlashcards(userId, accessibleFlashcards);

    res.status(200).json({
      success: true,
      data: { continueLesson, weakestSkill, overdueFlashcardCount: dueFlashcards.length },
    });
  } catch (error) {
    next(error);
  }
};