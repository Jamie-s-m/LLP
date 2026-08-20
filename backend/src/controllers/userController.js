import User from '../models/User.js';
import Progress from '../models/Progress.js';
import UserAchievement from '../models/UserAchievement.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { firstName, lastName, nativeLanguage, targetLanguages } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (nativeLanguage) user.nativeLanguage = nativeLanguage;
    if (targetLanguages) user.targetLanguages = targetLanguages;

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const [user, totalProgress] = await Promise.all([
      User.findById(req.user.id).select('-password'),
      Progress.find({ user: req.user.id }).populate('course')
    ]);

    const completedCourses = totalProgress.filter((item) => item.isCompleted).length;
    const totalXp = user?.xp || 0;

    res.status(200).json({
      success: true,
      data: {
        user,
        totalCourses: totalProgress.length,
        completedCourses,
        totalXp,
        streak: user?.streak || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await User.find({ role: 'student', isActive: true })
      .select('firstName lastName xp streak avatar')
      .sort({ xp: -1 })
      .limit(20);

    const currentUser = await User.findById(req.user.id).select('xp');
    const myRank = await User.countDocuments({
      role: 'student',
      isActive: true,
      xp: { $gt: currentUser?.xp || 0 },
    }) + 1;

    res.status(200).json({ success: true, data: { leaderboard, myRank } });
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (req, res, next) => {
  try {
    const achievements = await UserAchievement.find({ student: req.user.id })
      .populate('badge')
      .sort({ unlockedAt: -1 });

    res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
};
