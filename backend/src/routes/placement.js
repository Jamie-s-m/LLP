import express from 'express';
import { protect } from '../middleware/auth.js';
import { getPlacementQuestions, submitPlacement } from '../controllers/placementController.js';

const router = express.Router();

router.get('/questions', protect, getPlacementQuestions);
router.post('/submit', protect, submitPlacement);

export default router;
