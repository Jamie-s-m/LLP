import express from 'express';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';

const router = express.Router();

// 1. Seed endpoint (placed FIRST)
router.get('/seed', async (req, res) => {
  try {
    const count = await Course.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Courses already exist in database!', count });
    }

    const created = await Course.insertMany([
      {
        title: 'IELTS Speaking Masterclass',
        description: 'Master Parts 1, 2, and 3 with focus on fluency and vocabulary.',
        language: 'English',
        level: 'B2-C1',
        isPublished: true,
      },
      {
        title: 'Daily Turkish Conversation',
        description: 'Learn everyday expressions, essential grammar, and practical dialogues.',
        language: 'Turkish',
        level: 'A2-B1',
        isPublished: true,
      },
      {
        title: 'Korean Language Fundamentals',
        description: 'Master Hangul reading, essential particles, and daily structures.',
        language: 'Korean',
        level: 'A1-A2',
        isPublished: true,
      },
    ]);

    if (created[0]) {
      await Lesson.create({
        course: created[0]._id,
        title: 'Speaking Part 1 Strategies',
        content: 'Learn structure and phrase patterns for personal questions.',
        order: 1,
      });
    }

    res.json({ success: true, message: 'Seeded 3 courses successfully!', courses: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Fetch all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Fetch single course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const lessons = await Lesson.find({ course: req.params.id }).sort('order');
    res.json({ course, lessons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;