import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendPushToUsers } from '../utils/push.js';
import { sendPasswordResetEmail, sendVerificationEmail, buildVerificationUrl, buildPasswordResetUrl } from '../utils/email.js';
import { generateEmailVerificationToken, generatePasswordResetToken, hashEmailVerificationToken, hashToken } from '../utils/emailVerification.js';
import { normalizeModeratorPermissions } from '../middleware/auth.js';
import { serializeBilling } from '../utils/billing.js';
import { levelFromXp } from '../utils/level.js';
import logger from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `${(process.env.API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')}/auth/google/callback`;
const FRONTEND_BASE_URL =
  process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://linguanest.uz' : 'http://localhost:5173');
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

// Stateless CSRF state token for the OAuth redirect round-trip (no server-side session needed).
const signOAuthState = () => {
  const payload = String(Date.now());
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
};

const verifyOAuthState = (state) => {
  try {
    const [payload, signature] = Buffer.from(String(state || ''), 'base64url').toString('utf8').split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (!signature || signature !== expected) return false;
    const issuedAt = Number(payload);
    return Number.isFinite(issuedAt) && Date.now() - issuedAt < OAUTH_STATE_TTL_MS;
  } catch {
    return false;
  }
};

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

const serializeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role || 'student',
  teacherApplicationStatus: user.teacherApplicationStatus,
  isEmailVerified: user.isEmailVerified,
  moderatorPermissions: normalizeModeratorPermissions(user.moderatorPermissions),
  billing: serializeBilling(user.billing),
  xp: user.xp || 0,
  level: levelFromXp(user.xp || 0),
  streak: user.streak || 0,
  linguaCoins: user.linguaCoins || 0,
  hearts: typeof user.hearts === 'number' ? user.hearts : 5,
  maxHearts: typeof user.maxHearts === 'number' ? user.maxHearts : 5,
  placementLevel: user.placementLevel || null,
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
    logger.error('Email Check Error:', error);
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

    const token = generateToken(user._id, user.role || 'student');

    res.status(200).json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    logger.error('Login Error:', error);
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
    // Registering must never block on the mail server: it's a best-effort side effect, not
    // something the client should wait on (confirmed in production - an unreachable SMTP host
    // used to make this whole request hang, then take ~20s even after a bounded timeout was
    // added). The verification link is built synchronously below (pure string construction, no
    // I/O) so it's always available in the response regardless of whether the email itself
    // ever arrives.
    sendVerificationEmail({ user, token: verification.token }).catch((error) => {
      logger.error(`Verification email send failed for ${user.email}:`, error.message || error);
    });
    const previewUrl = buildVerificationUrl(user.email, verification.token);

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
      message: 'Account created. Check your email to verify it, or use the link below if it doesn\'t arrive.',
      data: {
        email: user.email,
        requiresVerification: true,
        previewUrl,
      },
    });
  } catch (error) {
    logger.error('Register Error:', error);
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
    logger.error('Email Verification Error:', error);
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

    sendVerificationEmail({ user, token: verification.token }).catch((error) => {
      logger.error(`Verification email resend failed for ${user.email}:`, error.message || error);
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent - check your inbox, or use the link below if it doesn\'t arrive.',
      data: { previewUrl: buildVerificationUrl(user.email, verification.token) },
    });
  } catch (error) {
    logger.error('Resend Verification Error:', error);
    res.status(500).json({ success: false, message: 'Unable to resend verification email' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email });
    let previewUrl = '';

    if (user) {
      const resetToken = generatePasswordResetToken();
      user.passwordResetToken = resetToken.tokenHash;
      user.passwordResetExpiresAt = resetToken.expiresAt;
      user.passwordResetSentAt = new Date();
      await user.save();

      // Unlike verification links, a password-reset link grants control of an existing real
      // account - it must never be returned in this response outside local/dev debugging,
      // regardless of whether the mail server is currently reachable. Sent in the background;
      // the request never waits on it.
      sendPasswordResetEmail({ user, token: resetToken.token }).catch((error) => {
        logger.error(`Password reset email failed for ${user.email}:`, error.message || error);
      });
      previewUrl = process.env.NODE_ENV === 'production' ? '' : buildPasswordResetUrl(user.email, resetToken.token);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
      data: { previewUrl },
    });
  } catch (error) {
    logger.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Unable to start password reset right now' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset link is invalid or expired' });
    }

    user.password = password;
    user.passwordResetToken = '';
    user.passwordResetExpiresAt = null;
    user.passwordResetSentAt = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    logger.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed' });
  }
});

router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_BASE_URL}/login?googleError=not_configured`);
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state: signOAuthState(),
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  const { code, state, error: googleError } = req.query;

  if (googleError || !code || !verifyOAuthState(state)) {
    return res.redirect(`${FRONTEND_BASE_URL}/login?googleError=denied`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${FRONTEND_BASE_URL}/login?googleError=not_configured`);
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const { sub: googleId, email, given_name: givenName, family_name: familyName, email_verified: emailVerified } = profileResponse.data;

    if (!email) {
      return res.redirect(`${FRONTEND_BASE_URL}/login?googleError=no_email`);
    }

    const cleanEmail = normalizeEmail(email);
    // Only fall back to matching an existing account by email when Google itself has verified
    // that email - otherwise a Google account created with an unverified address could log
    // straight into someone else's existing password account by matching on email alone.
    let user = await User.findOne({ googleId });
    if (!user && emailVerified) {
      user = await User.findOne({ email: cleanEmail });
    }

    if (!user) {
      user = await User.create({
        firstName: givenName || 'LinguaNest',
        lastName: familyName || 'Learner',
        email: cleanEmail,
        googleId,
        role: 'student',
        isEmailVerified: !!emailVerified,
      });
    } else if (user.googleId !== googleId) {
      user.googleId = googleId;
      if (emailVerified) user.isEmailVerified = true;
      await user.save();
    }

    if (!user.isActive) {
      return res.redirect(`${FRONTEND_BASE_URL}/login?googleError=disabled`);
    }

    const token = generateToken(user._id, user.role || 'student');
    res.redirect(`${FRONTEND_BASE_URL}/auth/google/callback?token=${encodeURIComponent(token)}`);
  } catch (error) {
    logger.error('Google OAuth Error:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_BASE_URL}/login?googleError=server_error`);
  }
});

export default router;