import mongoose from 'mongoose';
import Course from '../src/models/Course.js';
import Lesson from '../src/models/Lesson.js';
import Exercise from '../src/models/Exercise.js';
import Flashcard from '../src/models/Flashcard.js';

// Read-only pre-flight check for the new unique content-key indexes added in Phase 3
// (see Course.js/Lesson.js/Exercise.js/Flashcard.js). Those indexes cannot be built on a
// database that already contains duplicate contentKeys - which is exactly the risk left
// behind by the seed-idempotency bug (backend/src/seed.js) that ran, potentially repeatedly,
// against a live catalog before this fix. Run this BEFORE deploying the index change against
// any database that has ever been seeded under the old code:
//
//   node backend/scripts/checkDuplicateContentKeys.js --uri="<mongodb-connection-string>"
//
// Deliberately requires an explicit --uri flag rather than falling back to any .env file -
// this script is a manual, occasional diagnostic, and an implicit default here is exactly
// the kind of silent-wrong-target footgun the Phase 3 remediation was written to remove.
// Never writes anything; exits non-zero if any duplicate group is found.

const parseUri = () => {
  const arg = process.argv.slice(2).find((a) => a.startsWith('--uri='));
  return arg ? arg.slice('--uri='.length) : null;
};

const findDuplicates = async (Model, groupExpr, label) => {
  const duplicates = await Model.aggregate([
    { $match: { contentKey: { $type: 'string' } } },
    { $group: { _id: groupExpr, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicates.length === 0) {
    console.log(`${label}: no duplicates.`);
    return 0;
  }

  console.log(`${label}: ${duplicates.length} duplicate key group(s):`);
  duplicates.forEach((group) => {
    console.log(`  ${JSON.stringify(group._id)} -> ${group.count} documents: ${group.ids.join(', ')}`);
  });
  return duplicates.length;
};

const main = async () => {
  const uri = parseUri();
  if (!uri) {
    console.error('Usage: node backend/scripts/checkDuplicateContentKeys.js --uri="<mongodb-connection-string>"');
    process.exit(1);
  }

  console.log(`Connecting (read-only check) to ${uri.replace(/\/\/[^@]*@/, '//<redacted>@')} ...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const results = await Promise.all([
    findDuplicates(Course, '$contentKey', 'Course.contentKey'),
    findDuplicates(Lesson, { course: '$course', contentKey: '$contentKey' }, 'Lesson.(course, contentKey)'),
    findDuplicates(Exercise, { lesson: '$lesson', contentKey: '$contentKey' }, 'Exercise.(lesson, contentKey)'),
    findDuplicates(Flashcard, '$contentKey', 'Flashcard.contentKey'),
  ]);

  await mongoose.disconnect();

  const totalGroups = results.reduce((sum, n) => sum + n, 0);
  if (totalGroups > 0) {
    console.error(`\n${totalGroups} duplicate group(s) found. Dedupe before deploying the unique content-key indexes, or index creation will fail.`);
    process.exit(1);
  }

  console.log('\nNo duplicates found. Safe to deploy the unique content-key indexes.');
  process.exit(0);
};

main().catch((error) => {
  console.error('Duplicate check failed:', error);
  process.exit(1);
});
