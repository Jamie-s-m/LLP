import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Maps to POST http://localhost:5000/api/auth/register
router.post('/register', registerUser);

// Maps to POST http://localhost:5000/api/auth/login
router.post('/login', loginUser);

export default router;