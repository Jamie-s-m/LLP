# Architecture

## Runtime

The React/Vite frontend is deployed as a Render Static Site. The Express
backend runs as a Render Web Service and exposes `/api/*` plus Socket.IO.
MongoDB Atlas stores users, courses, lessons, exercises, flashcards,
placement-test questions, progress, messaging, family links, and billing
records. Redis is optional.

## Application boundaries

- `frontend/src/pages` contains user-facing flows.
- `frontend/src/store` contains client state.
- `frontend/src/services` contains API clients.
- `backend/src/routes` defines the API surface.
- `backend/src/controllers` contains request/business orchestration.
- `backend/src/models` contains MongoDB schemas.
- `backend/src/seed.js` is an explicit content synchronization tool.

## Module 1: online courses

- **Lessons** support `text`/`video`/`audio`/`interactive` content
  (`Lesson.contentType` + `mediaUrl`); video renders via
  `frontend/src/components/ui/VideoEmbed.tsx` (YouTube/Vimeo embed, with a
  plain `<video>` fallback for direct file URLs).
- **Exercises**: the `Exercise.type` schema enum has six values -
  `multiple_choice`, `fill_blank`, `matching`, `speaking`, `writing`,
  `listening` - but only three are actually reachable by a learner today.
  `multiple_choice` and `fill_blank` are auto-graded in
  `exerciseController.submitExercise` and are what the seeded content
  library (`backend/src/contentLibrary.js`) actually generates. `speaking`
  is recorded client-side, queued as
  `ExerciseAttempt.status: 'pending_review'`, and graded by a teacher via
  `GET/POST /api/exercises/reviews/speaking*` and
  `frontend/src/pages/teacher/SpeakingReviews.tsx`. `listening` has a real
  auto-grading code path in `submitExercise`, but zero `listening` exercises
  exist in the seeded catalog - there's nothing for a learner to reach yet.
  `matching` and `writing` are modeled in the schema but have neither
  generator content nor a practice UI.
- **Reference curriculum**: alongside the procedurally generated course
  catalog, `backend/src/data/referenceCurriculum.js` defines one
  hand-authored CEFR pathway ("English for Work", 3 lessons, A1-B1), seeded
  like the rest of the content library. `backend/src/data/
  curriculumBlueprint.js` holds a full A1-C2 design blueprint for expanding
  this pathway, not yet built out beyond those 3 lessons.
- **Mastery and certificates**: `backend/src/utils/masteryEngine.js` derives
  a per-skill mastery state (`'mastered'` / `'proficient'` / in-progress)
  from lesson completion plus attempts across at least
  `MIN_DISTINCT_EXERCISES_FOR_MASTERY` (2) distinct exercises - a single
  exercise type repeated cannot alone unlock mastery. `speaking` exercises
  are excluded from the distinct-exercise coverage count pending teacher
  review. Certificates are issued once mastery criteria are met, using the
  approved wording in `backend/src/data/certificateMethodology.js`, which is
  regression-tested to never claim official or Cambridge-equivalent
  certification.
- **Content authoring**: teachers edit a lesson's content, vocabulary,
  grammar, and exercises through `frontend/src/pages/teacher/LessonEditor.tsx`
  (backed by `PUT /api/lessons/:id` and the `/api/exercises` CRUD routes).
  Only the course's own instructor, an admin, or a moderator with the
  `catalogContentQa` permission can see an exercise's answer key or edit it.
- **Placement test**: `backend/src/models/PlacementQuestion.js` holds a
  32-question CEFR (A1-B2) bank (`backend/src/data/placementQuestions.js`,
  seeded like the rest of the content library). Scoring requires 75%+ correct
  within a CEFR tier to advance to the next; the result maps to
  `User.placementLevel` (Beginner/Intermediate/Advanced, matching the levels
  already used by the seeded course catalog) via
  `frontend/src/pages/PlacementTest.tsx`.

Authentication uses JWT. Route middleware enforces authentication and role
permissions. Production CORS is restricted to configured HTTPS origins.
