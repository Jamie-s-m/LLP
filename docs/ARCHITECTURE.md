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
- **Exercises** support `multiple_choice`, `fill_blank`, and `listening`
  (auto-graded in `exerciseController.submitExercise`) plus `speaking`
  (recorded client-side, queued as `ExerciseAttempt.status: 'pending_review'`,
  graded by a teacher via `GET/POST /api/exercises/reviews/speaking*` and
  `frontend/src/pages/teacher/SpeakingReviews.tsx`). `matching` and `writing`
  are modeled in the `Exercise` schema but have no practice UI yet.
- **Content authoring**: teachers edit a lesson's content, vocabulary,
  grammar, and exercises through `frontend/src/pages/teacher/LessonEditor.tsx`
  (backed by `PUT /api/lessons/:id` and the `/api/exercises` CRUD routes).
  Only the course's own instructor, an admin, or a moderator with the
  `catalogContentQa` permission can see an exercise's answer key or edit it.
- **Placement test**: `backend/src/models/PlacementQuestion.js` holds a
  16-question CEFR (A1-B2) bank (`backend/src/data/placementQuestions.js`,
  seeded like the rest of the content library). Scoring requires 75%+ correct
  within a CEFR tier to advance to the next; the result maps to
  `User.placementLevel` (Beginner/Intermediate/Advanced, matching the levels
  already used by the seeded course catalog) via
  `frontend/src/pages/PlacementTest.tsx`.

Authentication uses JWT. Route middleware enforces authentication and role
permissions. Production CORS is restricted to configured HTTPS origins.
