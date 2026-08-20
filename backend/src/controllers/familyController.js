import FamilyLink from '../models/FamilyLink.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';

export const listFamilyLinks = async (req, res, next) => {
  try {
    const filter = req.user.role === 'parent' ? { parent: req.user.id } : req.user.role === 'student' ? { student: req.user.id } : {};
    const links = await FamilyLink.find(filter)
      .populate('parent', 'firstName lastName email role')
      .populate('student', 'firstName lastName email role xp streak')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: links });
  } catch (error) { next(error); }
};

export const requestFamilyLink = async (req, res, next) => {
  try {
    const { studentEmail } = req.body;
    const student = await User.findOne({ email: String(studentEmail || '').toLowerCase().trim(), role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student account not found' });
    const existing = await FamilyLink.findOne({ parent: req.user.id, student: student._id });
    if (existing) return res.status(400).json({ success: false, message: 'Family request already exists' });
    const link = await FamilyLink.create({ parent: req.user.id, student: student._id, requestedBy: req.user.id });
    res.status(201).json({ success: true, data: link });
  } catch (error) { next(error); }
};

export const reviewFamilyLink = async (req, res, next) => {
  try {
    const link = await FamilyLink.findById(req.params.id);
    if (!link) return res.status(404).json({ success: false, message: 'Family request not found' });
    if (req.user.role === 'student' && link.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot review this family request' });
    }
    link.status = req.body.status === 'approved' ? 'approved' : 'rejected';
    link.reviewedBy = req.user.id;
    link.reviewedAt = new Date();
    await link.save();
    if (link.status === 'approved') {
      await Promise.all([
        User.findByIdAndUpdate(link.parent, { $addToSet: { children: link.student } }),
        User.findByIdAndUpdate(link.student, { $addToSet: { parents: link.parent } }),
      ]);
    }
    res.status(200).json({ success: true, data: link });
  } catch (error) { next(error); }
};

export const getChildrenProgress = async (req, res, next) => {
  try {
    const approvedLinks = await FamilyLink.find({ parent: req.user.id, status: 'approved' }).select('student');
    const studentIds = approvedLinks.map((link) => link.student);
    const [children, progressRecords] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select('firstName lastName xp streak'),
      Progress.find({ user: { $in: studentIds } }).select('progressPercentage lastAccessedAt'),
    ]);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeThisWeek = progressRecords.filter((record) => record.lastAccessedAt >= weekAgo).length;
    const averageProgress = progressRecords.length > 0
      ? Math.round(progressRecords.reduce((sum, record) => sum + record.progressPercentage, 0) / progressRecords.length)
      : 0;

    res.status(200).json({ success: true, data: { children, activeThisWeek, averageProgress } });
  } catch (error) { next(error); }
};

export const getChildDetail = async (req, res, next) => {
  try {
    const link = await FamilyLink.findOne({ parent: req.user.id, student: req.params.studentId, status: 'approved' });
    if (!link) return res.status(403).json({ success: false, message: 'You are not linked to this learner' });

    const [student, progressRecords] = await Promise.all([
      User.findById(req.params.studentId).select('firstName lastName email xp streak'),
      Progress.find({ user: req.params.studentId }).populate('course', 'title language level'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        student,
        courses: progressRecords.map((record) => ({
          courseId: record.course._id,
          title: record.course.title,
          progressPercentage: record.progressPercentage,
          isCompleted: record.isCompleted,
        })),
      },
    });
  } catch (error) { next(error); }
};
