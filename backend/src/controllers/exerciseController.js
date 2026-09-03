import Exercise from '../models/Exercise.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import ExerciseAttempt from '../models/ExerciseAttempt.js';
import { hasModeratorPermission, isOwnerId } from '../middleware/auth.js';
import { assertLessonOwnership as canManageLesson } from '../utils/ownership.js';
import { applyHeartsRegen, loseHeart, serializeHearts } from '../utils/hearts.js';
import { inferSkillFromType } from '../utils/skills.js';
import { requireLessonEntitlement } from '../utils/entitlement.js';
import { checkAndAwardBadges } from '../utils/achievements.js';

const assertExerciseOwnership = async (exerciseId, user) => {
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise) return { error: { status: 404, message: 'Exercise not found' } };
  const { error } = await canManageLesson(exercise.lesson, user);
  if (error) return { error };
  return { exercise };
};

// Content fields stripped from a locked exercise - mirrors getLessonById's locked-shell field
// list (title/type/skill/difficulty/points survive so the shape is still usable for a picker
// UI; everything a paying plan would actually be paying for does not).
const CONTENT_FIELDS = '-question -instructions -options -sentenceTemplate -leftItems -rightItems -audioReference -acceptablePronunciations -maxWords -minWords -audioFile -transcript -hints -explanation -description';

// Answer fields are only visible to whoever manages the exercise's course (so the content
// editor can load an existing exercise to edit it) - everyone else, including enrolled
// students, gets them stripped so a quiz can't be inspected for the answer key. Question/option
// content is additionally gated behind the same paywall submitExercise enforces - this list
// endpoint (and getExerciseById) used to let anyone read a gated exercise's full content without
// ever calling submit, which defeated the paywall entirely for read-only access.
export const getExercises = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const filter = lessonId ? { lesson: lessonId } : {};

    let canSeeAnswers = false;
    let canSeeContent = false;
    if (lessonId) {
      const { error } = await canManageLesson(lessonId, req.user);
      canSeeAnswers = !error;
      if (canSeeAnswers) {
        canSeeContent = true;
      } else {
        const lesson = await Lesson.findById(lessonId).select('order cefr course');
        canSeeContent = Boolean(lesson) && requireLessonEntitlement(lesson, req.user).allowed;
      }
    } else {
      // No lessonId means "every exercise in the catalog" - there is no legitimate non-manager
      // use case for that (the only real caller, teacher/Assignments.tsx, always passes a
      // lessonId), so only global content managers get full content in this branch.
      canSeeAnswers = req.user.role === 'admin' || hasModeratorPermission(req.user, 'catalogContentQa');
      canSeeContent = canSeeAnswers;
    }

    const query = Exercise.find(filter).sort({ createdAt: 1 });
    if (!canSeeAnswers) query.select('-correctAnswer -correctAnswers -correctPairs');
    if (!canSeeContent) query.select(CONTENT_FIELDS);
    const exercises = await query;
    res.status(200).json({ success: true, data: exercises, meta: canSeeContent ? undefined : { locked: true, requiresUpgrade: true } });
  } catch (error) {
    next(error);
  }
};

export const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    const { error } = await canManageLesson(exercise.lesson, req.user);
    const isManager = !error;
    if (error) {
      exercise.correctAnswer = undefined;
      exercise.correctAnswers = undefined;
      exercise.correctPairs = undefined;
    }

    // submitExercise already gates grading behind the paywall - this closes the same gate on
    // the read path, which previously let anyone fetch a gated exercise's full question/options
    // straight from its ID without ever calling submit (confirmed live: no billing check existed
    // here at all). Mirrors getLessonById's locked-shell pattern rather than a blanket 403.
    if (!isManager) {
      const lesson = await Lesson.findById(exercise.lesson).select('order cefr course').populate('course', 'instructor');
      if (lesson && !requireLessonEntitlement(lesson, req.user).allowed) {
        return res.status(200).json({
          success: true,
          data: {
            _id: exercise._id,
            lesson: exercise.lesson,
            type: exercise.type,
            skill: exercise.skill,
            difficulty: exercise.difficulty,
            points: exercise.points,
          },
          meta: { locked: true, requiresUpgrade: true },
        });
      }
    }

    res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};

export const createExercise = async (req, res, next) => {
  try {
    const {
      lessonId, title, description, type, question, instructions,
      options, correctAnswer,
      sentenceTemplate, correctAnswers,
      leftItems, rightItems, correctPairs,
      audioReference, acceptablePronunciations,
      maxWords, minWords,
      audioFile, transcript,
      difficulty, points, hints, explanation, tags, skill,
    } = req.body;

    const { error } = await canManageLesson(lessonId, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const exercise = await Exercise.create({
      lesson: lessonId,
      title,
      description,
      type,
      skill: skill || inferSkillFromType(type),
      question,
      instructions,
      options,
      correctAnswer,
      sentenceTemplate,
      correctAnswers,
      leftItems,
      rightItems,
      correctPairs,
      audioReference,
      acceptablePronunciations,
      maxWords,
      minWords,
      audioFile,
      transcript,
      difficulty,
      points: points || 10,
      hints,
      explanation,
      tags,
    });

    await Lesson.findByIdAndUpdate(lessonId, { $addToSet: { exercises: exercise._id } });

    res.status(201).json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};

export const updateExercise = async (req, res, next) => {
  try {
    const { exercise, error } = await assertExerciseOwnership(req.params.id, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    Object.assign(exercise, req.body);
    await exercise.save();
    res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};

export const deleteExercise = async (req, res, next) => {
  try {
    const { exercise, error } = await assertExerciseOwnership(req.params.id, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    await Exercise.findByIdAndDelete(exercise._id);
    await Lesson.findByIdAndUpdate(exercise.lesson, { $pull: { exercises: exercise._id } });
    res.status(200).json({ success: true, message: 'Exercise deleted' });
  } catch (error) {
    next(error);
  }
};

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const gradeAnswer = (exercise, answer) => {
  if (exercise.type === 'fill_blank') {
    const candidates = exercise.correctAnswers && exercise.correctAnswers.length > 0
      ? exercise.correctAnswers
      : [exercise.correctAnswer].filter((value) => typeof value === 'string' && value.length > 0);
    return candidates.some((candidate) => normalizeText(candidate) === normalizeText(answer));
  }

  // multiple_choice and listening both grade against an option index.
  return JSON.stringify(exercise.correctAnswer) === JSON.stringify(answer);
};

const feedbackAnswer = (exercise) => {
  if (exercise.type === 'fill_blank') {
    return exercise.correctAnswers?.[0] ?? exercise.correctAnswer;
  }
  return exercise.correctAnswer;
};

export const submitExercise = async (req, res, next) => {
  try {
    const { exerciseId, answer, audioBase64 } = req.body;
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const lesson = await Lesson.findById(exercise.lesson).select('order cefr course').populate('course', 'instructor');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }
    const isManager = user.role === 'admin'
      || hasModeratorPermission(user, 'catalogContentQa')
      || isOwnerId(lesson.course?.instructor, user.id);
    const entitlement = requireLessonEntitlement(lesson, user);
    if (!entitlement.allowed && !isManager) {
      return res.status(entitlement.error.status).json({
        success: false,
        message: entitlement.error.message,
        data: entitlement.error.data,
      });
    }

    const skill = exercise.skill || inferSkillFromType(exercise.type);

    // Speaking exercises can't be auto-graded: queue the recording for a teacher to review
    // instead of gating on hearts or awarding XP now (see reviewSpeakingAttempt).
    if (exercise.type === 'speaking') {
      if (!audioBase64) {
        return res.status(400).json({ success: false, message: 'A recording is required for speaking exercises' });
      }

      const attempt = await ExerciseAttempt.create({
        user: user._id,
        exercise: exercise._id,
        skill,
        isCorrect: false,
        pointsAwarded: 0,
        status: 'pending_review',
        audioSubmission: audioBase64,
      });

      return res.status(200).json({
        success: true,
        data: { submitted: true, status: 'pending_review', attemptId: attempt._id },
      });
    }

    applyHeartsRegen(user);
    if (user.hearts <= 0) {
      await user.save();
      return res.status(403).json({
        success: false,
        message: 'Out of hearts. Wait for them to regenerate or refill with coins.',
        data: serializeHearts(user),
      });
    }

    const isCorrect = gradeAnswer(exercise, answer);
    const pointsAwarded = isCorrect ? exercise.points : 0;

    if (isCorrect) {
      user.xp = (user.xp || 0) + pointsAwarded;
    } else {
      loseHeart(user);
    }
    user.lastActiveDate = new Date();
    await user.save();

    await ExerciseAttempt.create({
      user: user._id,
      exercise: exercise._id,
      skill,
      isCorrect,
      pointsAwarded,
    });

    // Real XP was just awarded above - a badge could cross its threshold from this alone,
    // never having claimed a daily reward (the only place this check used to run). Matches the
    // same unlockedBadges shape the daily-reward claim response already returns.
    const unlockedBadges = isCorrect ? await checkAndAwardBadges(user._id) : [];

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        points: pointsAwarded,
        correctAnswer: feedbackAnswer(exercise),
        xp: user.xp,
        unlockedBadges,
        ...serializeHearts(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listSpeakingReviews = async (req, res, next) => {
  try {
    const attempts = await ExerciseAttempt.find({ status: 'pending_review' })
      .sort({ createdAt: 1 })
      .populate('user', 'firstName lastName email')
      .populate({
        path: 'exercise',
        select: 'question instructions points lesson',
        populate: { path: 'lesson', select: 'title course', populate: { path: 'course', select: 'title instructor' } },
      });

    const canReviewAll = req.user.role === 'admin' || hasModeratorPermission(req.user, 'catalogContentQa');
    const visible = canReviewAll
      ? attempts
      : attempts.filter((attempt) => isOwnerId(attempt.exercise?.lesson?.course?.instructor, req.user.id));

    res.status(200).json({ success: true, data: visible });
  } catch (error) {
    next(error);
  }
};

export const reviewSpeakingAttempt = async (req, res, next) => {
  try {
    const { isCorrect, feedback } = req.body;
    const attempt = await ExerciseAttempt.findById(req.params.attemptId).populate({
      path: 'exercise',
      populate: { path: 'lesson', populate: { path: 'course', select: 'instructor' } },
    });

    if (!attempt || attempt.status !== 'pending_review') {
      return res.status(404).json({ success: false, message: 'No pending review found for this submission' });
    }

    const isOwner = req.user.role === 'admin'
      || hasModeratorPermission(req.user, 'catalogContentQa')
      || isOwnerId(attempt.exercise?.lesson?.course?.instructor, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    const pointsAwarded = isCorrect ? (attempt.exercise?.points || 0) : 0;

    attempt.isCorrect = Boolean(isCorrect);
    attempt.pointsAwarded = pointsAwarded;
    attempt.status = 'graded';
    attempt.reviewedBy = req.user.id;
    attempt.reviewFeedback = feedback || '';
    attempt.reviewedAt = new Date();
    await attempt.save();

    if (pointsAwarded > 0) {
      await User.findByIdAndUpdate(attempt.user, { $inc: { xp: pointsAwarded } });
    }

    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    next(error);
  }
};
