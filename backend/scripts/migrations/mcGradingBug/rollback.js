#!/usr/bin/env node
// (E) Rollback - reverts every non-reverted GradingRemediation record for a reason, subtracting
// the exact credited amount back out of User.xp. Dry-run by default; pass --apply to actually
// write. Records are marked revertedAt, never deleted, so the audit trail survives a rollback.
//
// Usage (dry run - default, no writes):
//   node backend/scripts/migrations/mcGradingBug/rollback.js --uri="<mongodb-uri>"
// Usage (actually revert):
//   node backend/scripts/migrations/mcGradingBug/rollback.js --uri="<mongodb-uri>" --apply
import mongoose from 'mongoose';
import { rollbackRemediation, DEFAULT_REASON } from './lib.js';

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

const main = async () => {
  const { uri, reason = DEFAULT_REASON, apply } = parseArgs();
  if (!uri) {
    console.error('Usage: node rollback.js --uri="<mongodb-uri>" [--reason=<name>] [--apply]');
    process.exit(1);
  }

  console.log(`Connecting to ${uri.replace(/\/\/[^@]*@/, '//<redacted>@')} ...`);
  console.log(apply ? 'MODE: APPLY (will write)' : 'MODE: DRY RUN (no writes) - pass --apply to actually revert');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const result = await rollbackRemediation({ reason, dryRun: !apply });

  await mongoose.disconnect();

  console.log(`\nReason: ${result.reason}`);
  console.log(`Records evaluated: ${result.results.length}`);
  console.log(`Reverted: ${result.revertedCount}`);
  result.results.forEach((entry) => {
    console.log(`  user=${entry.userId} xpCredited=${entry.xpCredited} -> ${entry.status}`);
  });
};

main().catch((error) => {
  console.error('Rollback failed:', error);
  process.exit(1);
});
