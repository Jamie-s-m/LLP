import jwt from 'jsonwebtoken';
import AnalyticsEvent, { PUBLIC_ANALYTICS_EVENTS } from '../models/AnalyticsEvent.js';

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-secret';
// Found too narrow in the Phase 3 security re-audit: this list didn't include 'fullname',
// 'ssn', 'dob', or 'note'/'comment'-shaped fields, so an unauthenticated POST could store a
// fake SSN, full name, date of birth, and a free-text note verbatim - demonstrated live.
const SENSITIVE_KEYS = [
  'email', 'password', 'token', 'firstname', 'lastname', 'fullname', 'name',
  'phone', 'address', 'ssn', 'social', 'passport', 'nationalid', 'dob', 'birth',
  'note', 'comment', 'message', 'card', 'cvv', 'iban', 'routing', 'account',
];
// Real call sites (see frontend/src/utils/analytics.ts's callers) only ever send short enum-
// like values (plan keys, exercise types, role names, Mongo ObjectIds) - nothing legitimate
// today exceeds ~20 characters. 60 leaves generous headroom while still rejecting
// sentence-shaped free text.
const MAX_METADATA_VALUE_LENGTH = 60;
const MAX_METADATA_KEYS = 15;

// Key-name denylists are trivially bypassed by renaming a field (e.g. 'ssn' -> 'taxId') - what
// actually reaches the database has to be checked too, independent of what it was called.
const looksLikeSsn = (value) => /\b\d{3}-?\d{2}-?\d{4}\b/.test(value);
const looksLikeEmail = (value) => /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(value);
const looksLikeCardNumber = (value) => /\b\d{13,19}\b/.test(value.replace(/[ -]/g, ''));
const containsSensitiveValuePattern = (value) => looksLikeSsn(value) || looksLikeEmail(value) || looksLikeCardNumber(value);

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
    if (stringValue.length > MAX_METADATA_VALUE_LENGTH) continue; // reject free-text-sized values
    if (containsSensitiveValuePattern(stringValue)) continue;
    clean[key] = value;
    count += 1;
  }
  return clean;
};

export const trackEvent = async (req, res) => {
  try {
    const { event, metadata, path, anonymousId } = req.body || {};

    // This route is intentionally unauthenticated (fires from pre-signup pages), so it must
    // never accept an event whose truth can't be independently verified from the request
    // itself. payment_completed/subscription_cancelled/payment_refunded are NOT in this list -
    // see PUBLIC_ANALYTICS_EVENTS's comment in the model - so they 400 here exactly like any
    // other unrecognized event name, the same way a forged event always has.
    if (!PUBLIC_ANALYTICS_EVENTS.includes(event)) {
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
