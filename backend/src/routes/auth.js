// TEMPORARY: Seed sample courses into MongoDB
router.get('/seed-courses', async (req, res) => {
  try {
    const Course = (await import('../models/Course.js')).default;
    const Lesson = (await import('../models/Lesson.js')).default;

    // Check if courses already exist
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

    // Attach sample lesson to the first course
    await Lesson.create({
      course: created[0]._id,
      title: 'Speaking Part 1 Strategies',
      content: 'Learn structure and phrase patterns for personal questions.',
      order: 1,
    });

    res.json({ success: true, message: 'Seeded 3 courses and sample lesson!', courses: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});