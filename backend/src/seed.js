import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI missing in environment');

    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // 1. Clear existing database collections to prevent duplicates
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});

    // 2. Hash passwords
    const adminPasswordHash = await bcrypt.hash('Password123!', 10);
    const studentPasswordHash = await bcrypt.hash('Student123!', 10);

    // 3. Seed Users
    const users = await User.create([
      {
        firstName: 'Aziz',
        lastName: 'Kayumkhodjaev',
        email: 'moreartyjames@gmail.com',
        password: adminPasswordHash,
        role: 'admin',
        isEmailVerified: true,
      },
      {
        firstName: 'Sample',
        lastName: 'Student',
        email: 'student@example.com',
        password: studentPasswordHash,
        role: 'student',
        isEmailVerified: true,
      },
    ]);
    console.log(`✓ Created ${users.length} default users with hashed passwords!`);

    // 4. Seed Courses
    const sampleCourses = [
      {
        title: 'IELTS Speaking Masterclass',
        description: 'Master Parts 1, 2, and 3 with focus on fluency, vocabulary, and discourse markers.',
        language: 'English',
        level: 'B2-C1',
        isPublished: true,
      },
      {
        title: 'Daily Turkish Conversation',
        description: 'Learn everyday expressions, essential grammar, and practical dialogue patterns.',
        language: 'Turkish',
        level: 'A2-B1',
        isPublished: true,
      },
      {
        title: 'Korean Language Fundamentals',
        description: 'Master Hangul reading, essential particles, and foundational sentence structures.',
        language: 'Korean',
        level: 'A1-A2',
        isPublished: true,
      },
    ];

    const createdCourses = await Course.insertMany(sampleCourses);
    console.log(`✓ Successfully seeded ${createdCourses.length} courses!`);

    // 5. Seed Lessons
    if (createdCourses[0]) {
      await Lesson.create({
        course: createdCourses[0]._id,
        title: 'Introduction & Part 1 Overview',
        content: 'Overview of common IELTS Speaking Part 1 topics and structuring answers.',
        order: 1,
      });
      console.log('✓ Created initial lesson!');
    }

    process.exit(0);
  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();