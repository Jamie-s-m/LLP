import Exercise from '../models/Exercise.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import ExerciseAttempt from '../models/ExerciseAttempt.js';
import { applyHeartsRegen, loseHeart, serializeHearts } from '../utils/hearts.js';
import { inferSkillFromType } from '../utils/skills.js';

export const getExercises = async (req, res, next) => {
  try {
    const { lessonId } = req.query;
    const filter = lessonId ? { lesson: lessonId } : {};
    const exercises = await Exercise.find(filter).select('-correctAnswer').sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: exercises });
  } catch (error) {
    next(error);
  }
};

export const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id).select('-correctAnswer');
    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }
    res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
};

export const createExercise = async (req, res, next) => {
  try {
    const { lessonId, title, description, type, question, options, correctAnswer, points, skill } = req.body;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const exercise = await Exercise.create({
      lesson: lessonId,
      title,
      description,
      type,
      skill: skill || inferSkillFromType(type),
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

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    applyHeartsRegen(user);
    if (user.hearts <= 0) {
      await user.save();
      return res.status(403).json({
        success: false,
        message: 'Out of hearts. Wait for them to regenerate or refill with coins.',
        data: serializeHearts(user),
      });
    }

    const isCorrect = JSON.stringify(exercise.correctAnswer) === JSON.stringify(answer);
    const pointsAwarded = isCorrect ? exercise.points : 0;

    if (isCorrect) {
      user.xp = (user.xp || 0) + pointsAwarded;
    } else {
      loseHeart(user);
    }
    user.lastActiveDate = new Date();
    await user.save();

    await ExerciseAttempt.create({
      user: user._id,
      exercise: exercise._id,
      skill: exercise.skill || inferSkillFromType(exercise.type),
      isCorrect,
      pointsAwarded,
    });

    res.status(200).json({
      success: true,
      data: {
        isCorrect,
        points: pointsAwarded,
        correctAnswer: exercise.correctAnswer,
        xp: user.xp,
        ...serializeHearts(user),
      },
    });
  } catch (error) {
    next(error);
  }
};
