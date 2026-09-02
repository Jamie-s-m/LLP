import Flashcard from '../models/Flashcard.js';
import Course from '../models/Course.js';
import FlashcardProgress from '../models/FlashcardProgress.js';
import User from '../models/User.js';
import { hasModeratorPermission, isOwnerId } from '../middleware/auth.js';
import { hasActivePlan, isCourseFreeForFlashcards } from '../utils/entitlement.js';

// SM-2 spaced-repetition rating buttons, mapped to the classic 0-5 quality scale.
const RATING_TO_QUALITY = { again: 1, hard: 3, good: 4, easy: 5 };

// XP scales with recall quality (a correct-but-slow "hard" still counts, a failed "again"
// gives a token amount); coins are reserved for genuine successful recall (good/easy) so
// a large deck can't be farmed for coins by clicking through it once with "again" spam.
const XP_BY_QUALITY = { 1: 1, 3: 3, 4: 4, 5: 5 };
const COINS_BY_QUALITY = { 1: 0, 3: 0, 4: 1, 5: 1 };

// Standard SM-2 algorithm: given a quality score (0-5), returns the next
// interval/easeFactor/repetitions for a flashcard-progress record.
const applySm2 = (progress, quality) => {
  if (quality < 3) {
    progress.repetitions = 0;
    progress.interval = 1;
  } else {
    if (progress.repetitions === 0) progress.interval = 1;
    else if (progress.repetitions === 1) progress.interval = 6;
    else progress.interval = Math.round(progress.interval * progress.easeFactor);
    progress.repetitions += 1;
  }

  progress.easeFactor = Math.max(
    1.3,
    progress.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  progress.quality = quality;
  progress.lastReviewDate = new Date();
  progress.nextReviewDate = new Date(Date.now() + progress.interval * 24 * 60 * 60 * 1000);
  progress.isNew = false;
  progress.isLearning = progress.repetitions > 0 && progress.repetitions < 2;
  progress.isReview = progress.repetitions >= 2;

  return progress;
};

// Narrows an already-fetched flashcard list down to the ones actually due for review today
// (no progress yet, or progress.nextReviewDate has passed) - the SM-2 schedule applySm2
// computes on every review would otherwise be entirely write-only, and a student would review
// the full deck from scratch every single session regardless of what they already know.
// Exported so other callers (the Dashboard "today" recommendation) can get an overdue count
// without duplicating this filter against a different flashcard set.
export const filterDueFlashcards = async (userId, flashcards) => {
  const progressRecords = await FlashcardProgress.find({
    student: userId,
    flashcard: { $in: flashcards.map((card) => card._id) },
  }).select('flashcard nextReviewDate');
  const nextReviewByCard = new Map(progressRecords.map((record) => [record.flashcard.toString(), record.nextReviewDate]));

  const now = new Date();
  return flashcards.filter((card) => {
    const nextReviewDate = nextReviewByCard.get(card._id.toString());
    return !nextReviewDate || nextReviewDate <= now;
  });
};

// Flashcards carry no CEFR level of their own - only their course does, and there's no "lesson
// 1" equivalent for a course-wide deck (see entitlement.js's isCourseFreeForFlashcards). Narrows
// an already-fetched flashcard list down to ones the user is entitled to, so a free student
// browsing the unscoped deck (no courseId) sees only cards from A1 (free) courses. Exported for
// the Dashboard "today" recommendation's overdue count, so it never counts a card the student
// can't actually open.
export const filterAccessibleFlashcards = async (flashcards, user) => {
  if (hasActivePlan(user) || flashcards.length === 0) return flashcards;
  // course is optional on Flashcard (never enforced at the schema level) - a card with no
  // course to check against has nothing to gate it, so it stays accessible.
  const courseIds = [...new Set(flashcards.filter((card) => card.course).map((card) => String(card.course)))];
  const courses = courseIds.length > 0 ? await Course.find({ _id: { $in: courseIds } }).select('cefr') : [];
  const cefrByCourseId = new Map(courses.map((course) => [String(course._id), course.cefr]));
  return flashcards.filter((card) => !card.course || isCourseFreeForFlashcards(cefrByCourseId.get(String(card.course))));
};

export const getFlashcards = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const filter = courseId ? { course: courseId } : {};

    // A specific gated course gets an explicit 402 (mirroring submitExercise) rather than a
    // silently empty deck - the unscoped browse case below stays a quiet filter instead, since
    // there's no single "this course" the student was asking for.
    if (courseId && !hasActivePlan(req.user)) {
      const course = await Course.findById(courseId).select('cefr');
      if (course && !isCourseFreeForFlashcards(course.cefr)) {
        return res.status(402).json({
          success: false,
          message: "This course's flashcards require an active LinguaNest plan.",
          data: { requiresUpgrade: true },
        });
      }
    }

    const flashcards = await Flashcard.find(filter).sort({ createdAt: -1 });
    const accessibleFlashcards = courseId ? flashcards : await filterAccessibleFlashcards(flashcards, req.user);
    const dueFlashcards = await filterDueFlashcards(req.user.id, accessibleFlashcards);

    res.status(200).json({
      success: true,
      data: dueFlashcards,
      meta: { dueCount: dueFlashcards.length, totalCount: accessibleFlashcards.length },
    });
  } catch (error) {
    next(error);
  }
};

export const createFlashcard = async (req, res, next) => {
  try {
    const { courseId, language, front, back, category, difficulty } = req.body;
    if (!front?.text || !back?.text || !language) {
      return res.status(400).json({ success: false, message: 'Flashcard text and language are required' });
    }
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Flashcards must be attached to a course' });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (req.user.role !== 'admin' && !hasModeratorPermission(req.user, 'catalogContentQa') && !isOwnerId(course.instructor, req.user.id)) {
      return res.status(403).json({ success: false, message: 'You do not manage this course' });
    }

    const card = await Flashcard.create({
      course: courseId,
      language,
      front,
      back,
      category,
      difficulty,
    });

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

export const reviewFlashcard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const quality = RATING_TO_QUALITY[rating];

    if (typeof quality !== 'number') {
      return res.status(400).json({ success: false, message: 'rating must be one of: again, hard, good, easy' });
    }

    const card = await Flashcard.findById(id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }

    let progress = await FlashcardProgress.findOne({ student: req.user.id, flashcard: card._id });
    if (!progress) {
      progress = new FlashcardProgress({
        student: req.user.id,
        flashcard: card._id,
        deck: card.category || String(card.course),
      });
    }

    applySm2(progress, quality);
    await progress.save();

    const xpAwarded = XP_BY_QUALITY[quality] || 0;
    const coinsAwarded = COINS_BY_QUALITY[quality] || 0;
    const user = await User.findById(req.user.id);
    user.xp = (user.xp || 0) + xpAwarded;
    user.linguaCoins = (user.linguaCoins || 0) + coinsAwarded;
    user.lastActiveDate = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        ...card.toObject(),
        reviewed: true,
        rating,
        interval: progress.interval,
        nextReviewDate: progress.nextReviewDate,
        repetitions: progress.repetitions,
        xpAwarded,
        coinsAwarded,
        totalXp: user.xp,
        totalLinguaCoins: user.linguaCoins,
      },
    });
  } catch (error) {
    next(error);
  }
};
