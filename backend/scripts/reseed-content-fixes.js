#!/usr/bin/env node
// Re-runs the content library sync (courses/lessons/exercises/flashcards) against
// production now that contentLibrary.js has been fixed to emit real content instead of
// placeholder text ("word-153" -> "uz-500" flashcard translations, "A correct answer /
// A weaker choice / A distractor" quiz options). Every item is upserted by contentKey via
// seedContent's existing findOneAndUpdate logic, so this is safe to re-run.
//
// One extra step this script does that plain seedContent doesn't: the old wordBank padded
// out to exactly 500 entries with fake "word-1".."word-300" filler; that padding is now
// removed, so this deletes the now-orphaned Flashcard documents (contentKey vocab-N for N
// beyond the real word count) that a plain upsert-only sync would otherwise leave behind.
// Usage: MONGODB_URI=<uri> node backend/scripts/reseed-content-fixes.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Flashcard from '../src/models/Flashcard.js';
import { seedContent } from '../src/seed.js';
import { LINGUANEST_CONTENT_LIBRARY } from '../src/contentLibrary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const result = await seedContent({ mode: 'production', confirm: true, force: true, silent: false });
  console.log('seedContent result:', result);

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const realWordCount = LINGUANEST_CONTENT_LIBRARY.vocabulary.length;
  const validKeys = LINGUANEST_CONTENT_LIBRARY.vocabulary.map((item) => item.id);

  const orphaned = await Flashcard.find({ contentKey: { $regex: /^vocab-\d+$/, $nin: validKeys } });
  console.log(`Real vocabulary words: ${realWordCount}. Orphaned placeholder flashcards to remove: ${orphaned.length}`);
  if (orphaned.length > 0) {
    const ids = orphaned.map((doc) => doc._id);
    const deleteResult = await Flashcard.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${deleteResult.deletedCount} orphaned placeholder flashcards.`);
  }

  const finalCount = await Flashcard.countDocuments();
  console.log(`Final flashcard count: ${finalCount}`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Reseeding content fixes failed:', error);
  process.exit(1);
});
