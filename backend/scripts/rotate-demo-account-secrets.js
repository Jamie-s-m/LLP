#!/usr/bin/env node
// One-time remediation: the demo/seed accounts created by ensureDemoUsers() in seed.js
// (admin@demo.linguanest.local, teacher@..., student@..., parent@...) use passwords that
// are hardcoded in that file - fine for a local dev database, a real security hole on a
// production database, since anyone who reads the repo has full admin access. This was
// discovered live: admin@demo.linguanest.local / DemoAdmin123! successfully authenticated
// against production with role "admin".
//
// This script rotates each demo account to a strong random password (properly bcrypt-hashed
// via the normal User pre-save hook) and deactivates every one of them except the teacher
// account, which stays active because it's recorded as the `instructor` on real published
// courses (Course.instructor) and deactivating it risks breaking instructor-facing UI.
// The new passwords are printed once to stdout and nowhere else - rotate again or delete
// these accounts outright if they are not needed going forward.
// Usage: MONGODB_URI=<uri> node backend/scripts/rotate-demo-account-secrets.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const DEMO_EMAILS = [
  { email: 'admin@demo.linguanest.local', keepActive: false },
  { email: 'teacher@demo.linguanest.local', keepActive: true },
  { email: 'student@demo.linguanest.local', keepActive: false },
  { email: 'parent@demo.linguanest.local', keepActive: false },
];

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI must be set (env var or backend/.env)');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to', mongoose.connection.name);

  for (const { email, keepActive } of DEMO_EMAILS) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`- ${email}: not found, nothing to rotate`);
      continue;
    }
    const newPassword = crypto.randomBytes(18).toString('base64url');
    user.password = newPassword;
    user.isActive = keepActive;
    await user.save();
    console.log(`- ${email}: role=${user.role} isActive=${user.isActive} newPassword=${newPassword}`);
  }

  await mongoose.disconnect();
  console.log('Done. Store or discard the printed passwords now - they are not saved anywhere.');
}

run().catch((error) => {
  console.error('Rotating demo account secrets failed:', error);
  process.exit(1);
});
