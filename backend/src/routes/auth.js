import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Maps to POST http://localhost:5000/api/auth/register
router.post('/register', registerUser);

// Maps to POST http://localhost:5000/api/auth/login
router.post('/login', loginUser);

// TEMPORARY: Auto-create or promote admin user
router.get('/make-me-admin', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const bcrypt = (await import('bcryptjs')).default;
    
    let user = await User.findOne({ email: 'moreartyjames@gmail.com' });

    if (!user) {
      // Create user directly if database is empty
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      user = await User.create({
        firstName: 'Aziz',
        lastName: 'Kayumkhodjaev',
        email: 'moreartyjames@gmail.com',
        password: hashedPassword,
        role: 'admin',
      });
      return res.json({
        success: true,
        message: 'Admin user created successfully! Log in with Password123!',
        user,
      });
    }

    // Update existing user to admin
    user.role = 'admin';
    await user.save();

    res.json({
      success: true,
      message: 'User updated to admin successfully!',
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;