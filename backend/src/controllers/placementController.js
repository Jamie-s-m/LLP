import PlacementQuestion from '../models/PlacementQuestion.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const TIERS = ['A1', 'A2', 'B1', 'B2'];
// Course.level only has 3 tiers; this mirrors the mapping already used by the seeded course
// catalog (A1->Beginner, A2/B1->Intermediate, B2->Advanced).
const TIER_TO_LEVEL = { A1: 'Beginner', A2: 'Intermediate', B1: 'Intermediate', B2: 'Advanced' };
const PASS_RATIO = 0.75;

export const getPlacementQuestions = async (req, res, next) => {
  try {
    const questions = await PlacementQuestion.find().select('-correctAnswer').sort({ order: 1 });
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

export const submitPlacement = async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Answers are required' });
    }

    const questions = await PlacementQuestion.find({ _id: { $in: answers.map((entry) => entry.questionId) } });
    const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));

    const tierStats = { A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 }, B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 } };
    let totalCorrect = 0;

    answers.forEach(({ questionId, answer }) => {
      const question = questionMap.get(String(questionId));
      if (!question) return;
      tierStats[question.cefr].total += 1;
      if (Number(answer) === question.correctAnswer) {
        tierStats[question.cefr].correct += 1;
        totalCorrect += 1;
      }
    });

    let achievedTier = null;
    for (const tier of TIERS) {
      const stats = tierStats[tier];
      if (stats.total === 0) break;
      if (stats.correct / stats.total >= PASS_RATIO) {
        achievedTier = tier;
      } else {
        break;
      }
    }

    const cefr = achievedTier || 'A1';
    const level = TIER_TO_LEVEL[cefr];

    await User.findByIdAndUpdate(req.user.id, { placementLevel: level, placementCompletedAt: new Date() });

    const recommendedCourses = await Course.find({ level, isPublished: true }).limit(3);

    res.status(200).json({
      success: true,
      data: { cefr, level, totalCorrect, totalQuestions: answers.length, tierStats, recommendedCourses },
    });
  } catch (error) {
    next(error);
  }
};
