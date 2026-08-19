import express from 'express';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';

const router = express.Router();

// Seed Route (Must stay before /:id)
router.get('/seed', async (req, res) => {
  try {
    const count = await Course.countDocuments();
    if (count > 0) return res.json({ message: 'Courses already seeded', count });

    const courses = await Course.insertMany([
      { title: 'IELTS Speaking Masterclass', description: 'Master Parts 1, 2, and 3.', language: 'English', level: 'B2-C1', isPublished: true },
      { title: 'Daily Turkish Conversation', description: 'Practical dialogues and grammar.', language: 'Turkish', level: 'A2-B1', isPublished: true },
      { title: 'Korean Language Fundamentals', description: 'Master Hangul reading and daily phrases.', language: 'Korean', level: 'A1-A2', isPublished: true }
    ]);

    await Lesson.create({ course: courses[0]._id, title: 'Speaking Part 1 Strategies', content: 'Structuring personal answers.', order: 1 });

    res.json({ success: true, message: 'Database seeded!', courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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