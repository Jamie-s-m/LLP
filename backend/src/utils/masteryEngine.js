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

// A lesson can only be called 'mastered' once the learner has demonstrated it across the
// lesson's distinct exercises, not just repeated one easy item until the accuracy math looks
// good. MIN_DISTINCT_EXERCISES_FOR_MASTERY is a floor beneath "attempted every exercise in the
// lesson" (full coverage): it exists so a lesson that (today) has only 2 auto-graded exercises
// is still reachable, while a lesson with just 1 gradable exercise can never be 'mastered' from
// that single item alone - by design, matching the release-gate requirement that one correct
// answer must never be sufficient evidence. As the curriculum grows past the current 3-lesson
// reference pathway (see curriculumBlueprint.js), the real gate is full coverage - this floor
// only matters for today's smallest lessons.
const MIN_DISTINCT_EXERCISES_FOR_MASTERY = 2;

// Pure function over already-fetched data - no DB access - so it's independently testable and
// reusable from both computeLessonMastery (below) and any future caller (analytics, admin
// content-coverage view) without re-querying.
//
// totalDistinctExercises is the lesson's real exercise count (computeLessonMastery passes
// exerciseIds.length, already fetched there) - deliberately NOT inferred from attempts, since
// "how many exercises has this learner touched" and "how many exercises does this lesson have"
// are different numbers and conflating them was exactly the bug (see below).
export const deriveMasteryState = ({ lessonCompleted, attempts, totalDistinctExercises = 0 }) => {
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
  // from "never learned it" (introduced/practicing) or "still learning" (developing). This
  // dedup also does double duty as the evidence-coverage measure below: repeated/duplicate
  // submissions of the same exercise collapse to one entry here, so grinding one easy item
  // can never look like broader coverage than it is.
  const latestByExercise = new Map();
  graded
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((attempt) => latestByExercise.set(String(attempt.exercise), attempt));
  const latestAttempts = Array.from(latestByExercise.values());
  const latestCorrectCount = latestAttempts.filter((attempt) => attempt.isCorrect).length;
  const latestAccuracy = latestAttempts.length > 0 ? latestCorrectCount / latestAttempts.length : 0;

  // The bug this replaces: `graded.length >= latestAttempts.length` is a tautology (dedup of
  // a list can never be longer than the list it came from), so it was always true and blocked
  // nothing - one correct attempt on one exercise satisfied both this and the accuracy check.
  // A real coverage requirement instead: every distinct exercise in the lesson must have been
  // attempted at least once (full coverage), with a floor so today's 2-exercise lessons stay
  // reachable - see the constant's comment above.
  const hasSufficientDistinctEvidence = totalDistinctExercises > 0
    && latestAttempts.length >= totalDistinctExercises
    && latestAttempts.length >= MIN_DISTINCT_EXERCISES_FOR_MASTERY;

  // hasSufficientDistinctEvidence gates BOTH 'mastered' and 'proficient', not just the top
  // tier - PROFICIENT_STATES (below) treats either as certificate/level-readiness-eligible,
  // so an evidence floor only on 'mastered' would leave 'proficient' as an easier, ungated
  // route to the exact same certificate. Without enough coverage, even 100% accuracy can only
  // reach 'developing' - an honest reflection of "too little evidence to say either way" that
  // deliberately looks like a demotion, because it is one, on purpose.
  if (accuracy >= 0.9 && latestAccuracy < accuracy) return 'needs_review';
  if (accuracy >= 0.9 && hasSufficientDistinctEvidence) return 'mastered';
  if (accuracy >= 0.75 && hasSufficientDistinctEvidence) return 'proficient';
  if (accuracy >= 0.5) return 'developing';
  return 'practicing';
};

// Mirrors exerciseController.js#submitExercise's `if (exercise.type === 'speaking')` branch:
// that's the only exercise type that starts 'pending_review' instead of 'graded' - it needs a
// teacher's independent review before it can ever count as evidence (see isEvidenceGraded
// above). Requiring full coverage of the lesson's exercises for mastery must not silently
// require an async teacher review the learner has no control over, so it's excluded from the
// coverage count. If it's later reviewed and graded, it still contributes to accuracy/recency
// normally - it just isn't a hard requirement for reaching 'mastered'/'proficient'.
const MANUAL_REVIEW_EXERCISE_TYPES = new Set(['speaking']);

export const computeLessonMastery = async (userId, lessonId) => {
  const lesson = await Lesson.findById(lessonId).select('course exercises objectives cefr');
  if (!lesson) return null;

  const [progress, lessonExercises] = await Promise.all([
    Progress.findOne({ user: userId, course: lesson.course }),
    Exercise.find({ lesson: lessonId }).select('_id type'),
  ]);

  const exerciseIds = lessonExercises.map((exercise) => exercise._id);
  const autoGradableExerciseCount = lessonExercises.filter(
    (exercise) => !MANUAL_REVIEW_EXERCISE_TYPES.has(exercise.type)
  ).length;

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
    state: deriveMasteryState({ lessonCompleted, attempts, totalDistinctExercises: autoGradableExerciseCount }),
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
