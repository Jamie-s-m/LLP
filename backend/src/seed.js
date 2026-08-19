import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';

dotenv.config();

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

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI missing in environment');

    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Create courses
    const createdCourses = await Course.insertMany(sampleCourses);
    console.log(`✓ Successfully seeded ${createdCourses.length} courses!`);

    // Add 1 sample lesson to the first course
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