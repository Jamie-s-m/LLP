import jwt from 'jsonwebtoken';
import AnalyticsEvent, { ANALYTICS_EVENTS } from '../models/AnalyticsEvent.js';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';
const SENSITIVE_KEYS = ['email', 'password', 'token', 'firstname', 'lastname', 'phone', 'address'];
const MAX_METADATA_KEYS = 15;

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

// Defense in depth: even though every call site is expected to only send small, non-sensitive
// context, strip anything that looks like PII before it ever reaches the database.
const sanitizeMetadata = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const clean = {};
  let count = 0;
  for (const [key, value] of Object.entries(input)) {
    if (count >= MAX_METADATA_KEYS) break;
    if (SENSITIVE_KEYS.some((bad) => key.toLowerCase().includes(bad))) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') continue; // no nested objects/arrays - keep events flat and small
    const stringValue = String(value);
    if (stringValue.length > 200) continue; // reject free-text-sized values
    clean[key] = value;
    count += 1;
  }
  return clean;
};

export const trackEvent = async (req, res) => {
  try {
    const { event, metadata, path, anonymousId } = req.body || {};

    if (!ANALYTICS_EVENTS.includes(event)) {
      return res.status(400).json({ success: false, message: 'Unknown event name' });
    }

    await AnalyticsEvent.create({
      event,
      user: tryGetUserId(req),
      anonymousId: typeof anonymousId === 'string' ? anonymousId.slice(0, 64) : null,
      path: typeof path === 'string' ? path.slice(0, 200) : '',
      metadata: sanitizeMetadata(metadata),
    });

    // Analytics must never block or fail the user's actual action - always 204, even if
    // validation above rejected something, the caller doesn't need to handle a tracking error.
    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
};
