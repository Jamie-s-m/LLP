import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendPushToUsers } from '../utils/push.js';
import { sendVerificationEmail } from '../utils/email.js';
import { generateEmailVerificationToken, hashEmailVerificationToken } from '../utils/emailVerification.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

const serializeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role || 'student',
  teacherApplicationStatus: user.teacherApplicationStatus,
  isEmailVerified: user.isEmailVerified,
});

router.get('/check-email', async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const existingUser = await User.findOne({ email }).select('email isEmailVerified role');

    res.status(200).json({
      success: true,
      data: {
        email,
        available: !existingUser,
        exists: !!existingUser,
        isEmailVerified: existingUser?.isEmailVerified || false,
      },
    });
  } catch (error) {
    console.error('Email Check Error:', error);
    res.status(500).json({ success: false, message: 'Unable to validate email right now' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been disabled. Please contact support.' });
    }

    if (!user.isEmailVerified) {
      if (user.emailVerificationToken) {
        return res.status(403).json({
          message: 'Please verify your email before signing in',
          data: { requiresVerification: true, email: user.email },
        });
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified && !user.emailVerificationToken) {
      user.isEmailVerified = true;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role || 'student' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
      user: serializeUser(user),
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

    if (!EMAIL_RE.test(normalizeEmail(email))) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const selectedRole = ['student', 'parent'].includes(role) ? role : 'student';
    const cleanEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        message: existingUser.isEmailVerified
          ? 'User already exists'
          : 'Account already exists but email is not verified yet',
        data: { requiresVerification: !existingUser.isEmailVerified, email: cleanEmail },
      });
    }

    const verification = generateEmailVerificationToken();

    const user = await User.create({
      firstName: firstName || 'New',
      lastName: lastName || 'User',
      email: cleanEmail,
      password,
      role: selectedRole,
      teacherApplicationStatus: selectedRole === 'student' && requestTeacherRole ? 'pending' : 'none',
      emailVerificationToken: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
      emailVerificationSentAt: new Date(),
    });
    const delivery = await sendVerificationEmail({ user, token: verification.token });

    if (user.teacherApplicationStatus === 'pending') {
      User.find({ role: 'admin' }).select('_id').then((admins) => {
        sendPushToUsers(admins.map((admin) => admin._id), {
          title: 'New teacher application',
          body: `${user.firstName} ${user.lastName} applied to teach on LinguaNest.`,
          url: '/admin/control-center',
        }).catch(() => {});
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email before signing in.',
      data: {
        email: user.email,
        requiresVerification: true,
        previewUrl: delivery.previewUrl,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const tokenHash = hashEmailVerificationToken(token);
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid or expired' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = '';
    user.emailVerificationExpiresAt = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now sign in.' });
  } catch (error) {
    console.error('Email Verification Error:', error);
    res.status(500).json({ success: false, message: 'Email verification failed' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found for this email' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'This email is already verified' });
    }

    const verification = generateEmailVerificationToken();
    user.emailVerificationToken = verification.tokenHash;
    user.emailVerificationExpiresAt = verification.expiresAt;
    user.emailVerificationSentAt = new Date();
    await user.save();

    const delivery = await sendVerificationEmail({ user, token: verification.token });

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      data: { previewUrl: delivery.previewUrl },
    });
  } catch (error) {
    console.error('Resend Verification Error:', error);
    res.status(500).json({ success: false, message: 'Unable to resend verification email' });
  }
});

export default router;