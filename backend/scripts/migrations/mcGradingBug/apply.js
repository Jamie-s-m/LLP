#!/usr/bin/env node
// (B) + (C) Dry-run and idempotent migration in one script - dry-run is the default; pass
// --apply to actually write anything. Applies a one-time flat XP grace credit per affected
// user (see lib.js's applyGraceCredit for exactly what this does and does not do - it never
// rewrites ExerciseAttempt history).
//
// Usage (dry run - default, no writes):
//   node backend/scripts/migrations/mcGradingBug/apply.js --uri="<mongodb-uri>" --cutoff=2026-09-02T00:00:00Z
// Usage (actually apply):
//   node backend/scripts/migrations/mcGradingBug/apply.js --uri="<mongodb-uri>" --cutoff=2026-09-02T00:00:00Z --apply
//
// Safe to run more than once: already-credited users are detected and skipped every time (see
// lib.js). Requires an explicit --uri, never falls back to any .env file.
import mongoose from 'mongoose';
import { applyGraceCredit, DEFAULT_REASON } from './lib.js';
import { redactUri, reportFatal } from '../../_scriptSafety.js';

const parseArgs = () => {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((arg) => !arg.includes('=')).map((arg) => arg.replace(/^--/, '')));
  const kv = Object.fromEntries(
    argv.filter((arg) => arg.includes('=')).map((arg) => {
      const [key, ...rest] = arg.replace(/^--/, '').split('=');
      return [key, rest.join('=')];
    })
  );
  return { ...kv, apply: flags.has('apply') };
};

// Hoisted to module scope so the catch handler below can redact it out of any error that
// echoes the connection string back - see _scriptSafety.js.
let uri;

const main = async () => {
  let cutoff, reason, apply;
  ({ uri, cutoff, reason = DEFAULT_REASON, apply } = parseArgs());
  if (!uri || !cutoff) {
    console.error('Usage: node apply.js --uri="<mongodb-uri>" --cutoff=<ISO-date> [--reason=<name>] [--apply]');
    process.exit(1);
  }
  const cutoffDate = new Date(cutoff);
  if (Number.isNaN(cutoffDate.getTime())) {
    console.error(`Invalid --cutoff date: ${cutoff}`);
    process.exit(1);
  }

  console.log(`Connecting to ${redactUri(uri)} ...`);
  console.log(apply ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes) - pass --apply to actually credit XP');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const result = await applyGraceCredit({ cutoffDate, reason, dryRun: !apply });

  await mongoose.disconnect();

  const counts = result.results.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1;
    return acc;
  }, {});
  console.log(`\nReason: ${result.reason}`);
  console.log(`Cutoff: ${cutoffDate.toISOString()}`);
  console.log(`Users evaluated: ${result.results.length}`);
  console.log('By status:', counts);
  result.results.forEach((entry) => {
    console.log(`  user=${entry.userId} xpForegone=${entry.xpForegone} attempts=${entry.affectedAttemptCount} -> ${entry.status}`);
  });
  if (apply) console.log('\nRun validate.js to confirm every affected user now has a remediation record.');
};

main().catch((error) => {
  reportFatal('Apply failed', error, uri);
  process.exit(1);
});
