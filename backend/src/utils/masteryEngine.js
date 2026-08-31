import Progress from '../models/Progress.js';
import ExerciseAttempt from '../models/ExerciseAttempt.js';
import Exercise from '../models/Exercise.js';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';

// PRIORITY 17/18: mastery is evidence-based, not "did they click complete." A lesson can be
// marked complete in Progress.completedLessons while genuinely not being mastered (low
// accuracy), and a course can be 100% "completed" while its mastery level is still low - the
// two are computed and reported separately on purpose, never collapsed into one number.
export const MASTERY_STATES = ['not_started', 'introduced', 'practicing', 'developing', 'proficient', 'mastered', 'needs_review'];

// Speaking attempts start 'pending_review' until a teacher grades them (see
// ExerciseAttempt.status) - excluded from accuracy math until reviewed, same as
// progressController.getSkillsBreakdown already does, so this doesn't invent a second
// inconsistent rule for the same data.
const isEvidenceGraded = (attempt) => attempt.status === 'graded';

// Pure function over already-fetched data - no DB access - so it's independently testable and
// reusable from both computeLessonMastery (below) and any future caller (analytics, admin
// content-coverage view) without re-querying.
export const deriveMasteryState = ({ lessonCompleted, attempts }) => {
  const graded = attempts.filter(isEvidenceGraded);

  if (!lessonCompleted && graded.length === 0) return 'not_started';
  if (!lessonCompleted) return 'introduced';

  if (graded.length === 0) {
    // Completed with zero graded evidence (e.g. only a pending-review speaking attempt so
    // far) - the learner engaged, but there's nothing yet to judge accuracy against.
    return 'practicing';
  }

  const correctCount = graded.filter((attempt) => attempt.isCorrect).length;
  const accuracy = correctCount / graded.length;

  // Recency: group by exercise, look at each exercise's most recent graded attempt. If the
  // learner was performing well historically but their latest attempt on something they'd
  // gotten right before was wrong, that's a real regression signal worth surfacing distinctly
  // from "never learned it" (introduced/practicing) or "still learning" (developing).
  const latestByExercise = new Map();
  graded
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((attempt) => latestByExercise.set(String(attempt.exercise), attempt));
  const latestAttempts = Array.from(latestByExercise.values());
  const latestCorrectCount = latestAttempts.filter((attempt) => attempt.isCorrect).length;
  const latestAccuracy = latestAttempts.length > 0 ? latestCorrectCount / latestAttempts.length : 0;

  if (accuracy >= 0.9 && latestAccuracy < accuracy) return 'needs_review';
  if (accuracy >= 0.9 && graded.length >= latestAttempts.length) return 'mastered';
  if (accuracy >= 0.75) return 'proficient';
  if (accuracy >= 0.5) return 'developing';
  return 'practicing';
};

export const computeLessonMastery = async (userId, lessonId) => {
  const lesson = await Lesson.findById(lessonId).select('course exercises objectives cefr');
  if (!lesson) return null;

  const [progress, exerciseIds] = await Promise.all([
    Progress.findOne({ user: userId, course: lesson.course }),
    Exercise.find({ lesson: lessonId }).distinct('_id'),
  ]);

  const lessonCompleted = Boolean(progress?.completedLessons?.some((id) => String(id) === String(lessonId)));
  const attempts = exerciseIds.length
    ? await ExerciseAttempt.find({ user: userId, exercise: { $in: exerciseIds } }).select('exercise isCorrect status createdAt')
    : [];

  return {
    lessonId: String(lessonId),
    cefr: lesson.cefr || null,
    objectives: lesson.objectives || [],
    completed: lessonCompleted,
    attemptCount: attempts.length,
    state: deriveMasteryState({ lessonCompleted, attempts }),
  };
};

const PROFICIENT_STATES = new Set(['proficient', 'mastered']);

export const computeCourseMastery = async (userId, courseId) => {
  const course = await Course.findById(courseId).select('lessons title');
  if (!course) return null;

  const lessonMasteries = await Promise.all(
    (course.lessons || []).map((lessonId) => computeLessonMastery(userId, lessonId))
  );
  const validLessons = lessonMasteries.filter(Boolean);

  const progress = await Progress.findOne({ user: userId, course: courseId });
  const completionPercentage = progress?.progressPercentage || 0;
  const completed = Boolean(progress?.isCompleted);

  const masteredCount = validLessons.filter((entry) => PROFICIENT_STATES.has(entry.state)).length;
  const masteryPercentage = validLessons.length > 0 ? Math.round((masteredCount / validLessons.length) * 100) : 0;

  return {
    courseId: String(courseId),
    // Deliberately two separate numbers - see the module-level comment. A learner who clicked
    // through every lesson without engaging with the exercises will show completed:true,
    // completionPercentage:100, masteryPercentage: low.
    completed,
    completionPercentage,
    masteryPercentage,
    lessons: validLessons,
  };
};

// PRIORITY 18: "level readiness" requires mastery evidence at every lesson tagged with that
// CEFR level in the given course, not just having clicked through the course. Simple,
// deterministic rule by design (see PRIORITY 84/126 in the earlier brief: no fake adaptive/ML
// scoring) - documented here so it can be tightened later against real outcome data instead of
// silently guessed at now.
export const isLevelReady = async (userId, courseId, cefr) => {
  const courseMastery = await computeCourseMastery(userId, courseId);
  if (!courseMastery) return { ready: false, reason: 'course_not_found' };

  const levelLessons = courseMastery.lessons.filter((lesson) => lesson.cefr === cefr);
  if (levelLessons.length === 0) return { ready: false, reason: 'no_lessons_at_level' };

  const allProficient = levelLessons.every((lesson) => PROFICIENT_STATES.has(lesson.state));
  return {
    ready: allProficient,
    reason: allProficient ? 'mastery_evidence_sufficient' : 'mastery_evidence_insufficient',
    lessonsEvaluated: levelLessons.length,
    lessonsProficient: levelLessons.filter((lesson) => PROFICIENT_STATES.has(lesson.state)).length,
  };
};
