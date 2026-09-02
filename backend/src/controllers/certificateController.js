import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import { computeCourseMastery, computeSkillMastery, isLevelReady } from '../utils/masteryEngine.js';
import { checkLevelReadinessAward, checkCourseCompletionAward } from '../utils/awardingEngine.js';
import { CERTIFICATE_ISSUER, CERTIFICATE_METHODOLOGY_STATEMENT, CERTIFICATE_LIMITATIONS_STATEMENT } from '../data/certificateMethodology.js';

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// The learner's own mastery + level-readiness view for a course - drives both the frontend
// progress UI and lets a caller (or the acceptance test) see exactly why they are/aren't
// certificate-eligible yet.
export const getCourseMastery = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const [courseMastery, skillMastery, course] = await Promise.all([
      computeCourseMastery(req.user.id, courseId),
      computeSkillMastery(req.user.id, courseId),
      Course.findById(courseId).populate('lessons', 'cefr'),
    ]);

    if (!courseMastery || !course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const levelsInCourse = Array.from(new Set((course.lessons || []).map((l) => l.cefr).filter(Boolean)))
      .sort((a, b) => CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b));

    const levelReadiness = {};
    for (const level of levelsInCourse) {
      levelReadiness[level] = await isLevelReady(req.user.id, courseId, level);
    }

    res.status(200).json({ success: true, data: { ...courseMastery, skills: skillMastery || [], levelReadiness } });
  } catch (error) {
    next(error);
  }
};

// Event-driven award checking: the frontend calls this after a lesson/exercise completes
// (rather than a cron job re-scanning every user) - proportionate for the current one
// reference-course scale, and idempotent either way via the unique index in awardingEngine.
export const checkCourseAwards = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('lessons', 'cefr');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const levels = Array.from(new Set((course.lessons || []).map((l) => l.cefr).filter(Boolean)));
    const levelResults = {};
    for (const level of levels) {
      levelResults[level] = await checkLevelReadinessAward(req.user.id, courseId, level);
    }
    const courseCompletionResult = await checkCourseCompletionAward(req.user.id, courseId);

    const newCertificates = [
      ...Object.values(levelResults).filter((r) => r.newlyIssued).map((r) => r.certificate),
      ...(courseCompletionResult.newlyIssued ? [courseCompletionResult.certificate] : []),
    ];

    res.status(200).json({ success: true, data: { levelResults, courseCompletionResult, newCertificates } });
  } catch (error) {
    next(error);
  }
};

export const listMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id, status: 'active' })
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};

// Public - no auth. Shows only what a real certificate would display (name, achievement,
// date, issuer, methodology) - never email or any internal id beyond the certificate's own
// non-guessable id.
export const verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('user', 'firstName lastName')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'No certificate found with this ID' });
    }

    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        learnerName: `${certificate.user?.firstName || ''} ${certificate.user?.lastName || ''}`.trim(),
        achievementType: certificate.achievementType,
        cefrLevel: certificate.cefrLevel,
        courseTitle: certificate.course?.title || '',
        issuedAt: certificate.createdAt,
        status: certificate.status,
        issuer: CERTIFICATE_ISSUER,
        methodology: CERTIFICATE_METHODOLOGY_STATEMENT,
        limitations: CERTIFICATE_LIMITATIONS_STATEMENT,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeCertificate = async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const certificate = await Certificate.findOneAndUpdate(
      { certificateId: req.params.certificateId, status: 'active' },
      { status: 'revoked', revokedReason: reason || '', revokedAt: new Date(), revokedBy: req.user.id },
      { new: true }
    );
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'No active certificate found with this ID' });
    }
    res.status(200).json({ success: true, data: certificate });
  } catch (error) {
    next(error);
  }
};
