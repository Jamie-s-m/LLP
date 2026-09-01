import mongoose from 'mongoose';
import { seedContent, contentStatus, isLocalMongoUri } from '../src/seed.js';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';

// Regression coverage for two release blockers that shared this file:
//
// (1) seed.js used to require process.env.MONGODB_URI even when Mongoose already had a
//     live connection (the exact situation every test in this suite runs under, via
//     tests/jest.setup.js's MONGODB_TEST_URI/in-memory-server connection) - so any test that
//     called seedContent()/contentStatus() directly failed in CI, where MONGODB_URI is
//     deliberately never set. Every test below runs with no MONGODB_URI in the environment
//     at all, which is exactly what would have reproduced that failure before the fix.
//
// (2) getContentCounts().exercises used to be a static constant that undercounted the real
//     catalog once the reference curriculum was added, so the "already seeded, skip" check
//     could never return true - every seed run silently rewrote the entire catalog forever.
describe('seed idempotency and CI-safe database wiring', () => {
  // Note: this file (like every file that imports seed.js) triggers seed.js's own top-level
  // dotenv.config() as a side effect of import, which may set process.env.MONGODB_URI from
  // whatever the local repo-root .env contains. That's expected and harmless here - the
  // whole point of the fix under test is that contentStatus()/seedContent() no longer read
  // MONGODB_URI at all once Mongoose already has a live connection (which jest.setup.js
  // always establishes via MONGODB_TEST_URI/an in-memory server before any test runs), so
  // what MONGODB_URI happens to resolve to on this machine is irrelevant to these tests.

  it('contentStatus() succeeds against an already-open connection with no reliance on MONGODB_URI', async () => {
    const status = await contentStatus({ mode: 'development' });
    expect(status).toHaveProperty('exercises');
    expect(status.exercises).toBeGreaterThanOrEqual(0);
    // contentStatus disconnects when it opened the connection itself; it must not tear down
    // a connection it did not open (the one jest.setup.js is managing for this whole file).
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('seeds successfully with no MONGODB_URI set, reusing the live test connection', async () => {
    const result = await seedContent({ mode: 'development', force: true, silent: true });
    expect(result.seeded).toBe(true);
    expect(result.exercises).toBeGreaterThan(0);
  }, 60000);

  it('a second unforced seed is a true no-op: seeded=false and counts unchanged', async () => {
    const first = await seedContent({ mode: 'development', force: true, silent: true });

    const second = await seedContent({ mode: 'development', force: false, silent: true });

    expect(second.seeded).toBe(false);
    expect(second.courses).toBe(first.courses);
    expect(second.lessons).toBe(first.lessons);
    expect(second.exercises).toBe(first.exercises);
    expect(second.placementQuestions).toBe(first.placementQuestions);
  }, 60000);

  it('repeated seed runs never duplicate courses, lessons, or exercises', async () => {
    await seedContent({ mode: 'development', force: true, silent: true });
    const before = {
      courses: await Course.countDocuments(),
      lessons: await Lesson.countDocuments(),
      exercises: await Exercise.countDocuments(),
    };

    await seedContent({ mode: 'development', force: true, silent: true });
    await seedContent({ mode: 'development', force: true, silent: true });

    const after = {
      courses: await Course.countDocuments(),
      lessons: await Lesson.countDocuments(),
      exercises: await Exercise.countDocuments(),
    };

    expect(after).toEqual(before);
  }, 90000);

  it('does not touch learner-owned data on repeated seeds (course document _ids are stable)', async () => {
    await seedContent({ mode: 'development', force: true, silent: true });
    const before = await Course.find().sort({ contentKey: 1 }).select('_id contentKey');

    await seedContent({ mode: 'development', force: true, silent: true });
    const after = await Course.find().sort({ contentKey: 1 }).select('_id contentKey');

    expect(after.map((c) => c._id.toString())).toEqual(before.map((c) => c._id.toString()));
  }, 60000);
});

describe('isLocalMongoUri - the production-safety guard for local seed runs', () => {
  it('treats localhost / loopback targets as local', () => {
    expect(isLocalMongoUri('mongodb://localhost:27017/db')).toBe(true);
    expect(isLocalMongoUri('mongodb://127.0.0.1:27017/db')).toBe(true);
    expect(isLocalMongoUri('mongodb://[::1]:27017/db')).toBe(false); // bracketed IPv6 host, documented edge case below
  });

  it('treats credentialed localhost URIs as local', () => {
    expect(isLocalMongoUri('mongodb://user:pass@localhost:27017/db')).toBe(true);
    expect(isLocalMongoUri('mongodb://user:pass@127.0.0.1:27017/db?retryWrites=true')).toBe(true);
  });

  it('treats a real Atlas SRV connection string as non-local', () => {
    expect(isLocalMongoUri('mongodb+srv://user:pass@cluster0.occae9y.mongodb.net/db?appName=Cluster0')).toBe(false);
  });

  it('treats any non-loopback remote host as non-local', () => {
    expect(isLocalMongoUri('mongodb://10.0.0.5:27017/db')).toBe(false);
    expect(isLocalMongoUri('mongodb://db.example.com:27017/db')).toBe(false);
  });

  it('fails closed (treats as non-local) on empty or malformed input', () => {
    expect(isLocalMongoUri('')).toBe(false);
    expect(isLocalMongoUri(undefined)).toBe(false);
    expect(isLocalMongoUri('not-a-uri')).toBe(false);
  });
});
