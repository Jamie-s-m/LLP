#!/usr/bin/env node
// Upserts the 16 built-in placement-test questions (backend/src/data/placementQuestions.js)
// into PlacementQuestion, keyed by `order` so it's safe to run repeatedly and never creates
// duplicates. This collection isn't touched by anything except this script and the general
// seed.js content pass, so an environment whose database was provisioned without ever running
// a full seed (e.g. a fresh production deploy) ends up with zero placement questions - the
// placement test page loads, "Start test" appears to do nothing, and the user is silently
// bounced back to the intro screen with no error, since PlacementTest.tsx has no empty-state UI.
// Usage: MONGODB_URI=<uri> node backend/scripts/seed-placement-questions.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import PlacementQuestion from '../src/models/PlacementQuestion.js';
import { placementQuestions } from '../src/data/placementQuestions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI must be set (env var or backend/.env)');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to', mongoose.connection.name);

  const before = await PlacementQuestion.countDocuments();
  console.log(`Existing placement questions: ${before}`);

  for (const questionData of placementQuestions) {
    await PlacementQuestion.findOneAndUpdate(
      { order: questionData.order },
      questionData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const after = await PlacementQuestion.countDocuments();
  console.log(`Placement questions after seeding: ${after} (expected ${placementQuestions.length})`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Seeding placement questions failed:', error);
  process.exit(1);
});
