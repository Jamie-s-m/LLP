#!/usr/bin/env node
// (A) Detection script - reports affected ExerciseAttempt records without changing anything.
//
// Usage:
//   node backend/scripts/migrations/mcGradingBug/detect.js --uri="<mongodb-uri>" --cutoff=2026-09-02T00:00:00Z
//
// --cutoff is the real deploy timestamp of the fixed contentLibrary.js build (not a commit
// date) - attempts on or after it were graded correctly and are not "affected". Requires an
// explicit --uri, never falls back to any .env file - see checkDuplicateContentKeys.js for why.
import mongoose from 'mongoose';
import { detectAffectedAttempts } from './lib.js';

const parseArgs = () => {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, ...rest] = arg.replace(/^--/, '').split('=');
      return [key, rest.join('=')];
    })
  );
  return args;
};

const main = async () => {
  const { uri, cutoff } = parseArgs();
  if (!uri || !cutoff) {
    console.error('Usage: node detect.js --uri="<mongodb-uri>" --cutoff=<ISO-date>');
    process.exit(1);
  }
  const cutoffDate = new Date(cutoff);
  if (Number.isNaN(cutoffDate.getTime())) {
    console.error(`Invalid --cutoff date: ${cutoff}`);
    process.exit(1);
  }

  console.log(`Connecting (read-only) to ${uri.replace(/\/\/[^@]*@/, '//<redacted>@')} ...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const report = await detectAffectedAttempts(cutoffDate);

  await mongoose.disconnect();

  console.log(`\nAffected generator multiple_choice exercises: ${report.affectedExerciseCount}`);
  console.log(`Affected (incorrectly-graded) attempts before ${cutoffDate.toISOString()}: ${report.totalAffectedAttempts}`);
  console.log(`Affected users: ${report.perUser.length}`);
  console.log(`Total XP foregone (upper-bound estimate): ${report.totalXpForegone}`);
  if (report.perUser.length > 0) {
    console.log('\nPer-user breakdown:');
    report.perUser.forEach((entry) => {
      console.log(`  user=${entry.userId} affectedAttempts=${entry.affectedAttemptCount} xpForegone=${entry.xpForegone}`);
    });
  }
};

main().catch((error) => {
  console.error('Detection failed:', error);
  process.exit(1);
});
