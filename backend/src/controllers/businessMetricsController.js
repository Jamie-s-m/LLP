import User from '../models/User.js';
import Progress from '../models/Progress.js';
import ExerciseAttempt from '../models/ExerciseAttempt.js';
import FlashcardProgress from '../models/FlashcardProgress.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Same implied rate the pricing tiers already use (800,000 UZS == $19 on the Learner plan),
// used only to express the local-currency-only "Local" plan in the same MRR total as the
// USD-priced Stripe plans. This is a conversion, not a live FX rate - MRR/ARPU below are
// explicitly labeled ESTIMATE because of it.
const IMPLIED_UZS_PER_USD = 800000 / 19;
const PLAN_USD_PRICE = {
  local: 39000 / IMPLIED_UZS_PER_USD,
  learner: 19,
  family: 39,
  teaching: 99,
};

const pctOf = (numerator, denominator) => (denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0);

export const getBusinessMetrics = async (req, res, next) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - DAY_MS);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

    const [
      registeredStudents,
      dailyActive,
      weeklyActive,
      monthlyActive,
      onboardingCompleted,
      placementCompleted,
      studentsWithAnyProgress,
      payingByPlan,
      totalPaying,
      cancellationsLast30d,
      lessonCompletionAgg,
      exerciseStats,
      vocabReviewAgg,
      retentionEligible,
      retentionStillActiveD1,
      retentionEligibleD7,
      retentionStillActiveD7,
      retentionEligibleD30,
      retentionStillActiveD30,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', lastActiveDate: { $gte: oneDayAgo } }),
      User.countDocuments({ role: 'student', lastActiveDate: { $gte: sevenDaysAgo } }),
      User.countDocuments({ role: 'student', lastActiveDate: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ role: 'student', onboardingCompletedAt: { $ne: null } }),
      User.countDocuments({ role: 'student', placementCompletedAt: { $ne: null } }),
      Progress.distinct('user', { 'completedLessons.0': { $exists: true } }),
      User.aggregate([
        { $match: { role: 'student', 'billing.status': 'active' } },
        { $group: { _id: '$billing.plan', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: 'student', 'billing.status': 'active' }),
      AnalyticsEvent.countDocuments({ event: 'subscription_cancelled', createdAt: { $gte: thirtyDaysAgo } }),
      Progress.aggregate([{ $group: { _id: null, total: { $sum: { $size: '$completedLessons' } } } }]),
      ExerciseAttempt.aggregate([
        { $match: { status: 'graded' } },
        { $group: { _id: null, total: { $sum: 1 }, correct: { $sum: { $cond: ['$isCorrect', 1, 0] } } } },
      ]),
      FlashcardProgress.aggregate([{ $group: { _id: null, total: { $sum: '$repetitions' } } }]),
      User.countDocuments({ role: 'student', createdAt: { $lte: oneDayAgo } }),
      User.countDocuments({ role: 'student', createdAt: { $lte: oneDayAgo }, $expr: { $gte: ['$lastActiveDate', { $add: ['$createdAt', DAY_MS] }] } }),
      User.countDocuments({ role: 'student', createdAt: { $lte: sevenDaysAgo } }),
      User.countDocuments({ role: 'student', createdAt: { $lte: sevenDaysAgo }, $expr: { $gte: ['$lastActiveDate', { $add: ['$createdAt', 7 * DAY_MS] }] } }),
      User.countDocuments({ role: 'student', createdAt: { $lte: thirtyDaysAgo } }),
      User.countDocuments({ role: 'student', createdAt: { $lte: thirtyDaysAgo }, $expr: { $gte: ['$lastActiveDate', { $add: ['$createdAt', 30 * DAY_MS] }] } }),
    ]);

    const byPlan = { local: 0, learner: 0, family: 0, teaching: 0 };
    payingByPlan.forEach((row) => {
      if (row._id && Object.prototype.hasOwnProperty.call(byPlan, row._id)) byPlan[row._id] = row.count;
    });
    const mrrUsd = Object.entries(byPlan).reduce((sum, [plan, count]) => sum + (PLAN_USD_PRICE[plan] || 0) * count, 0);

    const exerciseTotals = exerciseStats[0] || { total: 0, correct: 0 };

    res.status(200).json({
      success: true,
      data: {
        generatedAt: now.toISOString(),
        users: {
          _label: 'FACT',
          registered: registeredStudents,
          dailyActive,
          weeklyActive,
          monthlyActive,
        },
        activation: {
          _label: 'FACT',
          onboardingCompletionRate: pctOf(onboardingCompleted, registeredStudents),
          placementCompletionRate: pctOf(placementCompleted, registeredStudents),
          firstLessonCompletionRate: pctOf(studentsWithAnyProgress.length, registeredStudents),
        },
        retention: {
          _label: 'ESTIMATE',
          methodology: "Approximated from each user's single lastActiveDate timestamp (was this account still active at least N days after it registered), not a real daily login history. A user who was active once weeks ago and never since will still show as \"retained.\" True D1/D7/D30 needs several weeks of the analytics event stream (added this session) to accumulate before it can replace this proxy.",
          d1: pctOf(retentionStillActiveD1, retentionEligible),
          d7: pctOf(retentionStillActiveD7, retentionEligibleD7),
          d30: pctOf(retentionStillActiveD30, retentionEligibleD30),
          d1CohortSize: retentionEligible,
          d7CohortSize: retentionEligibleD7,
          d30CohortSize: retentionEligibleD30,
        },
        monetization: {
          _label: 'FACT, except mrrUsd/arpuUsd which are ESTIMATE (currency conversion)',
          payingUsers: totalPaying,
          conversionRate: pctOf(totalPaying, registeredStudents),
          payingByPlan: byPlan,
          mrrUsd: Math.round(mrrUsd * 100) / 100,
          arpuUsd: totalPaying > 0 ? Math.round((mrrUsd / totalPaying) * 100) / 100 : 0,
          cancellationsLast30d,
        },
        learning: {
          _label: 'FACT',
          lessonsCompleted: lessonCompletionAgg[0]?.total || 0,
          exercisesCompleted: exerciseTotals.total,
          averageAccuracyPercent: pctOf(exerciseTotals.correct, exerciseTotals.total),
          vocabularyReviews: vocabReviewAgg[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Returns real user contact info for founder-led interviews (priority: customer validation
// support). Segments are deliberately simple, deterministic rules - not a scoring model.
export const getUserSegment = async (req, res, next) => {
  try {
    const { segment } = req.query;
    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
    const select = 'firstName lastName email createdAt lastActiveDate billing.status billing.plan streak placementLevel onboardingCompletedAt';

    let query;
    switch (segment) {
      case 'new':
        query = { role: 'student', createdAt: { $gte: sevenDaysAgo } };
        break;
      case 'activated_not_paying': {
        const payingIds = await User.find({ role: 'student', 'billing.status': 'active' }).distinct('_id');
        query = { role: 'student', onboardingCompletedAt: { $ne: null }, placementCompletedAt: { $ne: null }, _id: { $nin: payingIds } };
        break;
      }
      case 'paying':
        query = { role: 'student', 'billing.status': 'active' };
        break;
      case 'churned':
        query = { role: 'student', 'billing.status': 'canceled' };
        break;
      case 'high_engagement':
        query = { role: 'student', streak: { $gte: 3 } };
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unknown segment. Use: new, activated_not_paying, paying, churned, high_engagement' });
    }

    const users = await User.find(query).select(select).sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, data: { segment, count: users.length, users } });
  } catch (error) {
    next(error);
  }
};
