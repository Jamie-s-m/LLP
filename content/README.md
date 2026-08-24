# LinguaNest content library

This directory organizes the demo education content used for the production-ready LinguaNest learning experience.

## Structure

- `courses/` — course source documents and metadata
- `vocabulary/` — vocabulary banks and flashcard dictionaries
- `assessments/` — placement and assessment question banks
- `seed/` — scripts and generated content used to initialize the app

## Content rules

- All seed content must be original or clearly demo-safe.
- Courses are mapped to CEFR-aligned learning outcomes.
- Each lesson should include learning goals, explanation, practice and completion criteria.
- Exercises should include explanations and correct answers, not blank validation.
- Use demo content only in development or staging unless approved for production content.
- Demo fallback content must never replace real production data silently.

## Commands

From the backend:

- `npm run seed` — load the demo library into MongoDB
- `npm test -- --runInBand backend/tests/contentValidation.test.js` — validate the library structure and counts

## Production checks

Before release, validate the full seed-to-API-to-UI flow:

1. `npm run seed`
2. `npm test -- --runInBand backend/tests/contentValidation.test.js`
3. Start the backend and confirm the learner path works against API data
4. Validate course discovery, enrollment, lesson completion, and progress persistence from the frontend

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
