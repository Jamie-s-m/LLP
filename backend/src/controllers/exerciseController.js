import Exercise from '../models/Exercise.js';
import Lesson from '../models/Lesson.js';

export const getExercises = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const filter = lessonId ? { lesson: lessonId } : {};
    const exercises = await Exercise.find(filter).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    next(error);
  }
};

export const createExercise = async (req, res, next) => {
  try {
    const { lessonId, title, description, type, question, options, correctAnswer, points } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const exercise = await Exercise.create({
      lesson: lessonId,
      title,
      description,
      type,
      question,
      options,
      correctAnswer,
      points: points || 10,
    });

    lesson.exercises.push(exercise._id);
    await lesson.save();

    res.status(201).json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};

export const submitExercise = async (req, res, next) => {
  try {
    const { exerciseId, answer } = req.body;
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    const isCorrect = JSON.stringify(exercise.correctAnswer) === JSON.stringify(answer);
    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        points: isCorrect ? exercise.points : 0,
        correctAnswer: exercise.correctAnswer,
      },
    });
  } catch (error) {
    next(error);
  }
};
