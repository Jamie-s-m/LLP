# LinguaNest content library

This directory organizes the demo education content used for the production-ready LinguaNest learning experience.

## Structure

There's no separate content file tree under this directory - everything
described below lives in the backend source, generated and seeded into
MongoDB at deploy/maintenance time, not stored as standalone content files:

- `backend/src/contentLibrary.js` — the procedural generator for the 7
  "General English"/Business English/Speaking/Kids courses, their vocabulary,
  and flashcards
- `backend/src/data/referenceCurriculum.js` — the one hand-authored
  reference pathway (3 lessons, A1-B1, "English for Work")
- `backend/src/data/curriculumBlueprint.js` — the A1-C2 CEFR design
  blueprint (content, not yet fully built out beyond the reference pathway)
- `backend/src/data/placementQuestions.js` — the 32-question placement bank
- `backend/src/data/certificateMethodology.js` — the approved certificate
  wording, regression-tested to never claim official/Cambridge certification
- `backend/src/data/badgeCatalog.js` — achievement badge definitions
- `backend/src/seed.js` — the idempotent upsert script that syncs all of the
  above into the database (see Commands below)

## Content rules

- All seed content must be original or clearly demo-safe.
- Courses are mapped to CEFR-aligned learning outcomes.
- Each lesson should include learning goals, explanation, practice and completion criteria.
- Exercises should include explanations and correct answers, not blank validation.
- Use demo content only in development or staging unless approved for production content.
- Demo fallback content must never replace real production data silently.

## Commands

All run from `backend/`:

- `npm run content:status` — read-only report of what's currently seeded (courses, lessons, exercises, placement questions, etc.)
- `npm run content:seed` — idempotent upsert into a local/development database
- `npm run content:seed:production -- --dry-run` — read-only preview of what a real production seed would change, with no writes
- `npm run content:seed:production` — the real, idempotent upsert against production (this script already passes `--confirm`; for anything other than `--mode=production` it also refuses to run unless the target database looks local, see `backend/src/seed.js`'s `assertSafeSeedTarget`)
- `npm run content:validate` — validate the library's structure and counts
- `node scripts/checkDuplicateContentKeys.js --uri="<mongodb-uri>"` — read-only pre-flight check for duplicate content identity keys; run before any production seed on a database that predates the unique-index migration

## Production checks

Before any production seed, follow the sequence documented in
`backend/scripts/migrations/mcGradingBug/README.md`'s procedure and this
repo's release-gate process: backup, dry run, apply, then re-validate with
`content:status` and `checkDuplicateContentKeys.js`.

## Expansion

To add a new course:

1. Add a course to the library generator.
2. Add lesson titles and objectives.
3. Ensure at least 3 exercises per lesson.
4. Include vocabulary and speaking tasks.
5. Validate content with the automated tests.

## Content identity

LinguaNest content is designed around the product promise:

Learn. Speak. Belong.
