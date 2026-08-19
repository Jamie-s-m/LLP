// backend/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Course from './models/Course.js';
import connectDB from './config/db.js';

dotenv.config();
await connectDB();

const seedData = async () => {
  try {
    await User.deleteMany();
    await Course.deleteMany();

    const adminUser = await User.create({
      firstName: 'Aziz',
      lastName: 'Kayumkhodjaev',
      email: 'admin@gmail.com',
      password: 'Password123!', // Ensure pre-save hook handles bcrypt hashing
      role: 'admin',
      isEmailVerified: true,
    });

    await Course.create({
      title: 'IELTS Speaking Masterclass',
      description: 'Comprehensive practice for Parts 1, 2, and 3.',
      language: 'English',
      level: 'Beginner', // Must match schema enum exactly
      category: 'Speaking',
      instructor: adminUser._id,
      isPublished: true,
    });

    console.log('Database successfully seeded!');
    process.exit();
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();