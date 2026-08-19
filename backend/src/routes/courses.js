import express from 'express';
const router = express.Router();

// GET /api/courses
router.get('/', (req, res) => {
  res.json({ success: true, courses: [] });
});

// GET /api/courses/:id
router.get('/:id', (req, res) => {
  res.json({ success: true, courseId: req.params.id });
});

// GET /api/courses/seed
router.get('/seed', async (req, res) => {
  try {
    const Course = (await import('../models/Course.js')).default;
    const Lesson = (await import('../models/Lesson.js')).default;

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

    res.json({ success: true, message: 'Seeded 3 courses!', courses: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;