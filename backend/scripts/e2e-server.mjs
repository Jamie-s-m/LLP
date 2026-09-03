// Boots the real backend for Playwright E2E runs (e2e/ at the repo root). Sequences a fresh
// database before the server starts, rather than relying on Playwright's webServer array to
// order two entries correctly - it starts every entry concurrently and only waits on each
// entry's own health check, so a separate "boot mongo" webServer entry offers no guarantee the
// database is ready before this one's process.env.MONGODB_URI would need it. Doing both steps
// in one process, in order, sidesteps that entirely.
//
// In CI (MONGODB_URI already set, pointing at the real mongodb service container also used by
// the Jest suite - see .github/workflows/ci-cd.yml) this skips straight to starting the server.
// Locally, it spins up its own mongodb-memory-server instance on a dedicated port/db so it never
// collides with a developer's own qa-boot-memdb.mjs session (port 27018) or dev MONGODB_URI.
import { spawnSync } from 'node:child_process';

const backendRoot = new URL('..', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1');

if (!process.env.MONGODB_URI) {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create({ instance: { port: 27019, dbName: 'linguanest-e2e' } });
  process.env.MONGODB_URI = mongod.getUri('linguanest-e2e');

  const shutdown = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

process.env.PORT = process.env.PORT || '5050';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-only-secret-not-used-in-production';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
// utils/email.js defaults this to http://localhost:5173 (a plain developer's own dev server,
// not this suite's dedicated port) - without overriding it, every verification/reset email
// preview link points at the wrong frontend instance entirely, which is silently wrong rather
// than loudly broken (the link still loads a real app, just one connected to a different
// database that never issued the token in the URL).
process.env.FRONTEND_APP_URL = process.env.FRONTEND_APP_URL || 'http://localhost:5180';
// The auth rate limiter (10 requests / 15 min by default, tested explicitly in
// security.test.js) is a real, correct anti-brute-force guard - but every E2E spec in this
// suite runs from the same localhost source IP, and a handful of specs each doing a real
// register/verify/login easily exceeds 10 requests inside one 15-minute run. Raised only here,
// not in the default.
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '200';
// Dummy but present so billing.getBillingPlans().available reflects reality in the E2E run's
// pricing page rather than silently showing every plan as unconfigured.
process.env.PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || 'e2e_payme_merchant';
process.env.PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY || 'e2e_payme_key';
process.env.CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || 'e2e_click_service';
process.env.CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID || 'e2e_click_merchant';
process.env.CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || 'e2e_click_secret';

// Real content (courses/lessons/placement questions) has to exist before the E2E spec can walk
// placement -> a real lesson -> a real gated exercise. Idempotent (seed.js's own upsert-by-key
// design), safe to run every time this script starts.
const seedResult = spawnSync(process.execPath, ['src/seed.js', '--mode=development', '--confirm'], {
  cwd: backendRoot,
  env: process.env,
  stdio: 'inherit',
});
if (seedResult.status !== 0) {
  console.error('E2E content seed failed - aborting before starting the server.');
  process.exit(seedResult.status || 1);
}

await import('../src/server.js');
