// Shared, DB-connection-agnostic logic for reconciling the historical multiple_choice grading
// bug (see backend/scripts/migrations/mcGradingBug/README.md for the full writeup). Every
// function here expects Mongoose to already have a live connection - the CLI scripts in this
// directory own connecting/disconnecting; this file is also imported directly by
// backend/tests/mcGradingBugMigration.test.js so the exact same code path is what's tested,
// not a reimplementation of it.
import { LINGUANEST_CONTENT_LIBRARY } from '../../../src/contentLibrary.js';
import Exercise from '../../../src/models/Exercise.js';
import ExerciseAttempt from '../../../src/models/ExerciseAttempt.js';
import User from '../../../src/models/User.js';
import GradingRemediation from '../../../src/models/GradingRemediation.js';

export const DEFAULT_REASON = 'mc-grading-bug-2026-09';

// The set of contentKeys the generator has ever produced for a multiple_choice exercise -
// exactly the population that was subject to the text-vs-index grading bug fixed in
// contentLibrary.js's createExercise(). Hand-authored reference-curriculum exercises
// (contentKey efw-ref-*) and teacher/admin-created exercises (no contentKey at all) were never
// affected and are excluded by construction - they simply never appear in this set, because
// this reads the same generator function production code calls, not a guessed pattern.
const getGeneratorMultipleChoiceExerciseKeys = () => {
  const keys = new Map();
  for (const lesson of LINGUANEST_CONTENT_LIBRARY.lessons) {
    for (const exercise of lesson.exercises || []) {
      if (exercise.type === 'multiple_choice') {
        keys.set(exercise.id, exercise.points || 10);
      }
    }
  }
  return keys;
};

// Finds every ExerciseAttempt that is "affected": on a generator-produced multiple_choice
// exercise, graded incorrect, created before the fix actually went live (cutoffDate) - the
// exact shape of a false negative from the bug. Read-only: never writes anything. cutoffDate
// must be passed explicitly (the real cutover is "whenever a fixed build first deployed", not
// derivable from any commit timestamp, since the fix may not be deployed yet).
export const detectAffectedAttempts = async (cutoffDate) => {
  if (!(cutoffDate instanceof Date) || Number.isNaN(cutoffDate.getTime())) {
    throw new Error('detectAffectedAttempts requires a valid cutoffDate');
  }

  const generatorKeys = getGeneratorMultipleChoiceExerciseKeys();
  const affectedExercises = await Exercise.find({
    type: 'multiple_choice',
    contentKey: { $in: Array.from(generatorKeys.keys()) },
  }).select('_id points contentKey');

  if (affectedExercises.length === 0) {
    return { affectedExerciseCount: 0, perUser: [], totalAffectedAttempts: 0, totalXpForegone: 0 };
  }

  const exerciseIds = affectedExercises.map((exercise) => exercise._id);
  const pointsByExerciseId = new Map(affectedExercises.map((exercise) => [String(exercise._id), exercise.points || 10]));

  const attempts = await ExerciseAttempt.find({
    exercise: { $in: exerciseIds },
    isCorrect: false,
    status: 'graded',
    createdAt: { $lt: cutoffDate },
  }).select('user exercise createdAt');

  const byUser = new Map();
  for (const attempt of attempts) {
    const userId = String(attempt.user);
    const points = pointsByExerciseId.get(String(attempt.exercise)) || 0;
    const current = byUser.get(userId) || { userId, affectedAttemptCount: 0, xpForegone: 0 };
    current.affectedAttemptCount += 1;
    current.xpForegone += points;
    byUser.set(userId, current);
  }

  const perUser = Array.from(byUser.values()).sort((a, b) => b.xpForegone - a.xpForegone);

  return {
    affectedExerciseCount: affectedExercises.length,
    totalAffectedAttempts: attempts.length,
    totalXpForegone: perUser.reduce((sum, entry) => sum + entry.xpForegone, 0),
    perUser,
  };
};

// Applies a one-time flat XP grace credit per affected user. This is deliberately NOT a
// recomputation of individual ExerciseAttempt correctness - ExerciseAttempt never stored what a
// learner actually selected, only the boolean outcome, so there is nothing to regrade with
// confidence (see README.md). dryRun defaults to true - callers must pass dryRun:false to
// actually write anything. Idempotent per (user, reason): a GradingRemediation record is
// checked for, then created, BEFORE the User.xp increment, and the unique (user, reason) index
// on the model is the hard backstop if two runs somehow race.
export const applyGraceCredit = async ({ cutoffDate, reason = DEFAULT_REASON, dryRun = true }) => {
  const detection = await detectAffectedAttempts(cutoffDate);
  const results = [];

  for (const entry of detection.perUser) {
    const existing = await GradingRemediation.findOne({ user: entry.userId, reason });
    if (existing) {
      results.push({ ...entry, status: 'already_credited' });
      continue;
    }

    if (dryRun) {
      results.push({ ...entry, status: 'would_credit' });
      continue;
    }

    try {
      await GradingRemediation.create({
        reason,
        user: entry.userId,
        xpCredited: entry.xpForegone,
        affectedAttemptCount: entry.affectedAttemptCount,
        cutoffDate,
      });
    } catch (error) {
      // Duplicate key on (user, reason): another run already credited this user between our
      // findOne above and this create - treat exactly like "already_credited", not an error.
      if (error?.code === 11000) {
        results.push({ ...entry, status: 'already_credited' });
        continue;
      }
      throw error;
    }

    await User.updateOne({ _id: entry.userId }, { $inc: { xp: entry.xpForegone } });
    results.push({ ...entry, status: 'credited' });
  }

  return { ...detection, dryRun, reason, cutoffDate, results };
};

// Confirms every currently-affected user (per detectAffectedAttempts) has a GradingRemediation
// record for `reason` - i.e. nothing real remains to apply. Read-only.
export const validateRemediation = async ({ cutoffDate, reason = DEFAULT_REASON }) => {
  const detection = await detectAffectedAttempts(cutoffDate);
  const uncredited = [];
  for (const entry of detection.perUser) {
    const existing = await GradingRemediation.findOne({ user: entry.userId, reason });
    if (!existing) uncredited.push(entry);
  }
  return { ...detection, reason, cutoffDate, uncredited, isFullyRemediated: uncredited.length === 0 };
};

// Reverts every non-reverted GradingRemediation record for `reason`: subtracts the exact
// credited amount back out of User.xp and marks the record reverted (never deletes it - the
// audit trail of "this credit was applied, then reverted" stays intact, and re-running rollback
// is naturally a no-op for already-reverted records via the revertedAt:null filter).
export const rollbackRemediation = async ({ reason = DEFAULT_REASON, dryRun = true }) => {
  const records = await GradingRemediation.find({ reason, revertedAt: null });
  const results = [];

  for (const record of records) {
    if (dryRun) {
      results.push({ userId: String(record.user), xpCredited: record.xpCredited, status: 'would_revert' });
      continue;
    }

    await User.updateOne({ _id: record.user }, { $inc: { xp: -record.xpCredited } });
    record.revertedAt = new Date();
    await record.save();
    results.push({ userId: String(record.user), xpCredited: record.xpCredited, status: 'reverted' });
  }

  return { reason, dryRun, revertedCount: results.filter((result) => result.status === 'reverted').length, results };
};
