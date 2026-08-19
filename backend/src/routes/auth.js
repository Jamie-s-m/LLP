import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'student',
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user: { id: user._id, firstName, lastName, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-seed/Make Admin Route
router.get('/make-me-admin', async (req, res) => {
  try {
    let user = await User.findOne({ email: 'moreartyjames@gmail.com' });
    if (!user) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      user = await User.create({
        firstName: 'Aziz',
        lastName: 'Kayumkhodjaev',
        email: 'moreartyjames@gmail.com',
        password: hashedPassword,
        role: 'admin',
      });
    } else {
      user.role = 'admin';
      await user.save();
    }
    res.json({ success: true, message: 'Admin account set!', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;