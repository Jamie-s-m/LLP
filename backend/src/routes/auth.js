import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Maps to POST http://localhost:5000/api/auth/register
router.post('/register', registerUser);

// Maps to POST http://localhost:5000/api/auth/login
router.post('/login', loginUser);

// TEMPORARY: Route to promote user to admin
router.get('/make-me-admin', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findOneAndUpdate(
      { email: 'moreartyjames@gmail.com' },
      { role: 'admin' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found in database' });
    res.json({ success: true, message: 'User promoted to admin successfully!', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;