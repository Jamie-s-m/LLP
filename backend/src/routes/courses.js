import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import { protect, authorize } from '../middleware/auth.js';
import { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controllers/courseController.js';

const router = express.Router();

router.get('/seed', async (req, res) => {
  try {
    const count = await Course.countDocuments();
    if (count > 0) {
      return res.json({ success: true, message: 'Courses already seeded', count });
    }

    let instructor = await User.findOne({ role: 'admin' });
    if (!instructor) {
      instructor = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@system.local',
        password: 'Password123!',
        role: 'admin',
      });
    }

    const courseData = [
      {
        title: 'IELTS Speaking Masterclass',
        description: 'Master Parts 1, 2, and 3 with focus on fluency and vocabulary.',
        category: 'Conversation',
        language: 'English',
        level: 'Advanced',
        instructor: instructor._id,
        isPublished: true,
      },
      {
        title: 'Daily Turkish Conversation',
        description: 'Learn everyday expressions, essential grammar, and practical dialogues.',
        category: 'Conversation',
        language: 'Turkish',
        level: 'Intermediate',
        instructor: instructor._id,
        isPublished: true,
      },
      {
        title: 'Korean Language Fundamentals',
        description: 'Master Hangul reading, essential particles, and daily structures.',
        category: 'Grammar',
        language: 'Uzbek',
        level: 'Beginner',
        instructor: instructor._id,
        isPublished: true,
      },
    ];

    const insertedCourses = await Course.insertMany(courseData);

    if (insertedCourses.length > 0) {
      await Lesson.create({
        course: insertedCourses[0]._id,
        title: 'Speaking Part 1 Strategies',
        content: 'Learn structure and phrase patterns for personal questions.',
        order: 1,
      });
    }

    res.json({ success: true, message: 'Seeded 3 courses successfully!', data: insertedCourses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Seeding failed' });
  }
});

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('teacher', 'admin'), createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);

export default router;