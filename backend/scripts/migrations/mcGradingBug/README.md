# Multiple-choice grading bug - historical data reconciliation

## The bug

`contentLibrary.js`'s `multiple_choice` exercise generator used to store `correctAnswer` as the
answer's **text**. Grading (`exerciseController.js#gradeAnswer`) and the real frontend
(`ExercisePractice.tsx`) have always compared against the selected option's **index**. Every
`multiple_choice` exercise from the generator therefore graded incorrect regardless of what a
student picked, until it was fixed at the source in `contentLibrary.js` (see that file's
`createExercise` comment) with a regression test
(`backend/tests/quiz-types-and-placement.test.js`).

Re-seeding self-heals every `Exercise` document going forward (confirmed: the fixed generator
deterministically produces `correctAnswer` in range for all 210 current templates). **It does
not, and cannot, touch already-recorded `ExerciseAttempt` history** - seeding only writes
content documents, never learner data.

## Answering the ten questions this migration has to answer

1. **Which exercises are affected?** Every `Exercise` whose `type === 'multiple_choice'` and
   whose `contentKey` was produced by the generator (`contentLibrary.js`) - not the hand-authored
   reference curriculum (`efw-ref-*`) and not a teacher/admin-created exercise (no `contentKey`
   at all, per the LessonEditor.tsx flow). `lib.js#detectAffectedAttempts` gets this set by
   walking the actual `LINGUANEST_CONTENT_LIBRARY` in-process - the same production code that
   generates the real catalog - rather than guessing at a regex pattern.
2. **How are affected answers detected safely?** By identity + time, never by inspecting the
   exercise's *current* `correctAnswer` value. An `ExerciseAttempt` is affected iff it's on one
   of the exercises from (1), `isCorrect: false`, `status: 'graded'`, and `createdAt` before an
   explicit `--cutoff` timestamp you supply (the real production deploy time of the fixed build -
   not a commit date, since deploy and commit are not the same moment for this repo).
3. **Can the correct option index be deterministically reconstructed?** Yes, for the *content* -
   re-seeding already does this, self-healing every `Exercise` document. **No**, for what a
   *specific historical attempt's* correctness should have been - see (6).
4. **Are there ambiguous cases?** Yes: if a generator template's wording/options were ever edited
   between when a document was seeded and now, matching by `contentKey` could theoretically pair
   an old document with a newer template version. No `contentVersion` field exists to detect this
   drift today. In practice: confirmed via `git log`/direct execution that every current
   `multiple_choice` template's answer is at index 0 and the fix has only shipped once - but this
   migration does not depend on that fact anyway, because of (6).
5. **Are assessments affected?** No. Placement test questions (`placementQuestions.js`) have
   always stored a numeric index - confirmed unchanged across the fix commit. The unused
   `assessmentBank`/`buildAssessmentSet` code in `contentLibrary.js` has the same latent
   text-vs-index pattern but is never seeded into any collection today, so nothing currently
   reads it.
6. **Which historical learner attempts were incorrectly marked wrong? Can they be recalculated?**
   Detectable (2) - but **not safely recalculable**. `ExerciseAttempt` never stored what the
   student actually selected (no `submittedAnswer`/`selectedAnswer` field), only the boolean
   outcome. Knowing "the correct index is now 0" says nothing about whether a *specific* historical
   `isCorrect: false` was a false negative from the bug or a genuine wrong answer - both look
   identical in the stored data. Recomputing `isCorrect` from "we now know the right answer" would
   mean assuming every historical wrong answer on an affected exercise was actually right, which
   is false for real mistakes too. **This migration never rewrites `ExerciseAttempt.isCorrect` or
   `pointsAwarded`.**
7. **How were XP/rewards/mastery affected?** `submitExercise` (`exerciseController.js`) awards
   `exercise.points` to `User.xp` only on `isCorrect: true`; a false-negative attempt earned 0 XP
   it should have earned `exercise.points`. Mastery/certificates (the Phase 2 engine) are new/
   unreleased and were never computed against this poisoned history in production - this
   migration does not attempt to backfill mastery state.
8. **Can historical records be safely recalculated?** No (see 6) - so this migration does not
   attempt to. Instead it applies a **one-time flat XP grace credit**: for each affected user, sum
   `exercise.points` across every affected wrong attempt (an upper-bound estimate of XP foregone)
   and credit that amount once, logged as its own `GradingRemediation` record - never as a silent
   `User.xp` mutation with no trace. `ExerciseAttempt.isCorrect` stays exactly as it was recorded:
   an honest record of what the system said at the time, not a rewritten one.
9. **What happens when reconstruction is uncertain?** It's always uncertain at the individual-
   attempt level (see 6) - so the design doesn't try to resolve that uncertainty per-attempt at
   all. The grace credit is explicitly framed to users/support as "we fixed a grading bug and
   credited you the XP you may have missed," not as a claim of per-question accuracy.
10. **Can the migration be run more than once safely?** Yes. `apply.js` checks for an existing
    `GradingRemediation` record for `(user, reason)` before writing anything, and the model has a
    unique index on that pair as a hard backstop if two runs race. Already-credited users are
    reported as `already_credited` and skipped, not re-credited.

## Procedure

```bash
# A. Detect (read-only) - see the scope and size of the problem first.
node backend/scripts/migrations/mcGradingBug/detect.js --uri="<uri>" --cutoff=<ISO-date>

# B. Dry run - apply.js with no --apply flag shows exactly what would change, no writes.
node backend/scripts/migrations/mcGradingBug/apply.js --uri="<uri>" --cutoff=<ISO-date>

# C. Apply - the actual, idempotent migration.
node backend/scripts/migrations/mcGradingBug/apply.js --uri="<uri>" --cutoff=<ISO-date> --apply

# D. Validate - confirms no affected/uncredited user remains. Exits non-zero if something is missed.
node backend/scripts/migrations/mcGradingBug/validate.js --uri="<uri>" --cutoff=<ISO-date>

# E. Rollback, if ever needed - reverts every GradingRemediation record for the reason.
node backend/scripts/migrations/mcGradingBug/rollback.js --uri="<uri>" --apply
```

Every script requires an explicit `--uri` - none of them fall back to any `.env` file. `--cutoff`
must be the real production deploy timestamp of the build containing the `contentLibrary.js` fix,
supplied by whoever runs this (not guessable from the repo).

## What this migration deliberately does NOT do

- Does not touch `Exercise.correctAnswer` - re-seeding after deploy already fixes that.
- Does not touch `ExerciseAttempt.isCorrect`/`pointsAwarded` - see question 6/8 above.
- Does not backfill mastery or certificate state.
- Does not use `deleteMany()`, `drop()`, or any destructive/bulk-replace operation.
