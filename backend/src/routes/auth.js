import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Maps to POST http://localhost:5000/api/auth/register
router.post('/register', registerUser);

// Maps to POST http://localhost:5000/api/auth/login
router.post('/login', loginUser);

// TEMPORARY: Make the first registered user or matching email an admin
router.get('/make-me-admin', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
    // Find all registered users
    const users = await User.find({});
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users exist in database yet.' });
    }

    // Promote the first registered user
    const targetUser = users[0];
    targetUser.role = 'admin';
    await targetUser.save();

    res.json({
      success: true,
      message: `User ${targetUser.email} updated to admin!`,
      user: targetUser,
      allUsers: users.map(u => ({ id: u._id, email: u.email, role: u.role }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;