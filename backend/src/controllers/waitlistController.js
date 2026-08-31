import jwt from 'jsonwebtoken';
import WaitlistEntry from '../models/WaitlistEntry.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_FEATURES = ['speaking_practice'];
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';

// Best-effort only: a logged-in visitor's waitlist entry is linked to their account for
// admin follow-up, but joining the waitlist never requires being signed in.
const tryGetUserId = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    return decoded.id || decoded._id || null;
  } catch {
    return null;
  }
};

export const joinWaitlist = async (req, res, next) => {
  try {
    const { email, name, feature, locale } = req.body || {};

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: 'A valid email is required' });
    }

    const resolvedFeature = ALLOWED_FEATURES.includes(feature) ? feature : 'speaking_practice';
    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await WaitlistEntry.findOne({ email: normalizedEmail, feature: resolvedFeature });
    if (existing) {
      return res.status(200).json({ success: true, data: { alreadyJoined: true, joinedAt: existing.createdAt } });
    }

    const entry = await WaitlistEntry.create({
      email: normalizedEmail,
      feature: resolvedFeature,
      name: (name || '').trim(),
      locale: locale || 'en',
      user: tryGetUserId(req),
    });

    return res.status(200).json({ success: true, data: { joinedAt: entry.createdAt } });
  } catch (error) {
    // Duplicate (email, feature) via the unique index - already on the list, not an error
    // from the caller's point of view.
    if (error?.code === 11000) {
      return res.status(200).json({ success: true, data: { alreadyJoined: true } });
    }
    next(error);
  }
};

export const getWaitlistCount = async (req, res, next) => {
  try {
    const { feature } = req.query;
    const resolvedFeature = ALLOWED_FEATURES.includes(feature) ? feature : 'speaking_practice';
    const count = await WaitlistEntry.countDocuments({ feature: resolvedFeature });
    return res.status(200).json({ success: true, data: { feature: resolvedFeature, count } });
  } catch (error) {
    next(error);
  }
};
