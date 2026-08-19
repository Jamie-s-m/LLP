import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Course from './models/Course.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/language-learn-platform';

try {
  await mongoose.connect(MONGODB_URI);

  await User.deleteMany({ email: 'admin@example.com' });
  const adminUser = await User.create({
    firstName: 'Platform',
    lastName: 'Admin',
    email: 'admin@example.com',
    password: 'Password123!',
    role: 'admin',
    isEmailVerified: true,
  });

  await Course.create({
    title: 'English Speaking Fundamentals',
    description: 'A starter course for practicing everyday English conversations.',
    language: 'English',
    level: 'Beginner',
    category: 'Conversation',
    instructor: adminUser._id,
    isPublished: true,
  });

  console.log('Database successfully seeded.');
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}