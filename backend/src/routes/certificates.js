import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getCourseMastery,
  checkCourseAwards,
  listMyCertificates,
  verifyCertificate,
  revokeCertificate,
} from '../controllers/certificateController.js';

const router = express.Router();

// Public - certificate verification must work without an account.
router.get('/verify/:certificateId', verifyCertificate);

router.get('/mine', protect, listMyCertificates);
router.get('/mastery/:courseId', protect, getCourseMastery);
router.post('/check-awards/:courseId', protect, checkCourseAwards);
router.patch('/:certificateId/revoke', protect, authorize('admin'), revokeCertificate);

export default router;
