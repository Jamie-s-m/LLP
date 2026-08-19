import Flashcard from '../models/Flashcard.js';

export const getFlashcards = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const filter = courseId ? { course: courseId } : {};
    const flashcards = await Flashcard.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: flashcards });
  } catch (error) {
    next(error);
  }
};

export const createFlashcard = async (req, res, next) => {
  try {
    const { courseId, language, front, back, category, difficulty } = req.body;
    if (!front?.text || !back?.text || !language) {
      return res.status(400).json({ success: false, message: 'Flashcard text and language are required' });
    }

    const card = await Flashcard.create({
      course: courseId,
      language,
      front,
      back,
      category,
      difficulty,
    });

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

export const reviewFlashcard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const card = await Flashcard.findById(id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }

    res.status(200).json({ success: true, data: { ...card.toObject(), reviewed: true } });
  } catch (error) {
    next(error);
  }
};
