#!/usr/bin/env node
// (D) Validation script - confirms no affected (uncredited) user remains for the given
// reason/cutoff. Read-only. Exits non-zero if anything is still uncredited, so it can be used
// as a real pass/fail gate, not just a report.
//
// Usage:
//   node backend/scripts/migrations/mcGradingBug/validate.js --uri="<mongodb-uri>" --cutoff=2026-09-02T00:00:00Z
import mongoose from 'mongoose';
import { validateRemediation, DEFAULT_REASON } from './lib.js';
import { redactUri, reportFatal } from '../../_scriptSafety.js';

const parseArgs = () => Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=')];
  })
);

// Hoisted to module scope so the catch handler below can redact it out of any error that
// echoes the connection string back - see _scriptSafety.js.
let uri;

const main = async () => {
  let cutoff, reason;
  ({ uri, cutoff, reason = DEFAULT_REASON } = parseArgs());
  if (!uri || !cutoff) {
    console.error('Usage: node validate.js --uri="<mongodb-uri>" --cutoff=<ISO-date> [--reason=<name>]');
    process.exit(1);
  }
  const cutoffDate = new Date(cutoff);
  if (Number.isNaN(cutoffDate.getTime())) {
    console.error(`Invalid --cutoff date: ${cutoff}`);
    process.exit(1);
  }

  console.log(`Connecting (read-only) to ${redactUri(uri)} ...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const result = await validateRemediation({ cutoffDate, reason });

  await mongoose.disconnect();

  console.log(`\nReason: ${result.reason}`);
  console.log(`Total affected users detected: ${result.perUser.length}`);
  console.log(`Uncredited: ${result.uncredited.length}`);

  if (result.uncredited.length > 0) {
    console.log('\nStill uncredited:');
    result.uncredited.forEach((entry) => {
      console.log(`  user=${entry.userId} affectedAttempts=${entry.affectedAttemptCount} xpForegone=${entry.xpForegone}`);
    });
    console.error('\nVALIDATION FAILED: run apply.js --apply to credit the users above.');
    process.exit(1);
  }

  console.log('\nVALIDATION PASSED: every affected user has a remediation record.');
};

main().catch((error) => {
  reportFatal('Validation failed', error, uri);
  process.exit(1);
});
