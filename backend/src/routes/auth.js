import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role || 'student' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role || 'student',
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message || 'Server error during authentication' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, requestTeacherRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const selectedRole = ['student', 'parent'].includes(role) ? role : 'student';
    const cleanEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      firstName: firstName || 'New',
      lastName: lastName || 'User',
      email: cleanEmail,
      password,
      role: selectedRole,
      teacherApplicationStatus: selectedRole === 'student' && requestTeacherRole ? 'pending' : 'none',
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teacherApplicationStatus: user.teacherApplicationStatus,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

export default router;