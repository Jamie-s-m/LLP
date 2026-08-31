import Course from '../models/Course.js';
import Certificate from '../models/Certificate.js';
import { computeCourseMastery, isLevelReady } from './masteryEngine.js';

// PRIORITY 19: kept deliberately separate from the existing XP/streak/coin gamification system
// (dailyRewardController.js, gamificationController.js) - a streak is a habit achievement, a
// certificate is an educational achievement, and this file only ever touches the latter. It
// does not award XP, coins, or badges; it only decides certificate eligibility from mastery
// evidence.

// A course "completed" (Progress.isCompleted) is not the same claim as "mastered" - see
// masteryEngine.js. This threshold is what actually gates a course_completion certificate;
// changing it later must not silently alter certificates already issued (evidenceSnapshot on
// Certificate is the historical record, not this constant).
const COURSE_COMPLETION_MASTERY_THRESHOLD = 100;

const highestCefr = (lessons) => {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return lessons
    .map((lesson) => lesson.cefr)
    .filter(Boolean)
    .sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] || null;
};

// Idempotent: relies on Certificate's unique (user, course, achievementType, cefrLevel) index,
// so calling this twice for a learner who already qualifies returns the existing certificate
// rather than throwing or duplicating.
const issueOrFetch = async ({ user, achievementType, course, cefrLevel, evidenceSnapshot }) => {
  const existing = await Certificate.findOne({ user, course, achievementType, cefrLevel });
  if (existing) return { certificate: existing, newlyIssued: false };

  try {
    const certificate = await Certificate.create({ user, achievementType, course, cefrLevel, evidenceSnapshot });
    return { certificate, newlyIssued: true };
  } catch (error) {
    if (error?.code === 11000) {
      const raced = await Certificate.findOne({ user, course, achievementType, cefrLevel });
      return { certificate: raced, newlyIssued: false };
    }
    throw error;
  }
};

export const checkLevelReadinessAward = async (userId, courseId, cefr) => {
  const readiness = await isLevelReady(userId, courseId, cefr);
  if (!readiness.ready) return { awarded: false, readiness };

  const { certificate, newlyIssued } = await issueOrFetch({
    user: userId,
    achievementType: 'level_readiness',
    course: courseId,
    cefrLevel: cefr,
    evidenceSnapshot: {
      masteryPercentage: null,
      lessonsEvaluated: readiness.lessonsEvaluated,
      lessonsProficient: readiness.lessonsProficient,
    },
  });

  return { awarded: true, newlyIssued, certificate, readiness };
};

export const checkCourseCompletionAward = async (userId, courseId) => {
  const [courseMastery, course] = await Promise.all([
    computeCourseMastery(userId, courseId),
    Course.findById(courseId).populate('lessons', 'cefr'),
  ]);

  if (!courseMastery || !course) return { awarded: false, reason: 'course_not_found' };
  if (!courseMastery.completed || courseMastery.masteryPercentage < COURSE_COMPLETION_MASTERY_THRESHOLD) {
    return { awarded: false, reason: 'mastery_evidence_insufficient', courseMastery };
  }

  const cefrLevel = highestCefr(course.lessons || []);
  if (!cefrLevel) return { awarded: false, reason: 'course_has_no_cefr_tagged_lessons' };

  const { certificate, newlyIssued } = await issueOrFetch({
    user: userId,
    achievementType: 'course_completion',
    course: courseId,
    cefrLevel,
    evidenceSnapshot: {
      masteryPercentage: courseMastery.masteryPercentage,
      lessonsEvaluated: courseMastery.lessons.length,
      lessonsProficient: courseMastery.lessons.filter((l) => ['proficient', 'mastered'].includes(l.state)).length,
    },
  });

  return { awarded: true, newlyIssued, certificate, courseMastery };
};
