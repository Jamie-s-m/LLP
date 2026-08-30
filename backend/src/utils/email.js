import axios from 'axios';
import nodemailer from 'nodemailer';

const getFrontendAppUrl = () =>
  String(process.env.FRONTEND_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

// Pure URL construction, no network I/O - callers that want the link immediately (without
// waiting for an actual send attempt against a possibly slow/unreachable mail provider) can use
// these directly instead of awaiting sendVerificationEmail/sendPasswordResetEmail.
export const buildVerificationUrl = (email, token) =>
  `${getFrontendAppUrl()}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

export const buildPasswordResetUrl = (email, token) =>
  `${getFrontendAppUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

export const getEmailProviderStatus = () => {
  const hasBird = Boolean(process.env.BIRD_API_KEY);
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  const hasSmtp = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

  return {
    configured: hasBird || hasSmtp,
    provider: hasBird ? 'bird-api' : hasSmtp ? 'smtp' : 'unconfigured',
    from: EMAIL_FROM || 'LinguaNest <no-reply@linguanest.uz>',
    mode: String(process.env.NODE_ENV || 'development').toLowerCase(),
  };
};

const parseFromHeader = (raw) => {
  const match = String(raw || '').match(/^(.*?)\s*<(.+)>$/);
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { email: String(raw || '').trim() };
};

// Bird's HTTP API sends over standard HTTPS (443), so it's unaffected by hosting platforms that
// block outbound SMTP ports - confirmed the hard way in production: Render's free tier blocks
// all outbound traffic to ports 25/465/587 as of a Sept 2025 policy change, which is exactly why
// the SMTP path kept timing out even with correct credentials. Region is derived from the key
// itself (e.g. "bk_eu1_..." -> "eu1"), matching how Bird issues keys.
const sendViaBirdApi = async ({ to, subject, html }) => {
  const apiKey = process.env.BIRD_API_KEY;
  const region = apiKey.split('_')[1] || 'us1';

  await axios.post(
    `https://${region}.platform.bird.com/v1/email/messages`,
    {
      from: parseFromHeader(process.env.EMAIL_FROM || 'LinguaNest <no-reply@linguanest.uz>'),
      to: [to],
      subject,
      html,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 10000,
    }
  );
};

const getSmtpTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Without these, a network path that silently drops packets (rather than actively
    // refusing the connection) makes sendMail hang indefinitely. 10s is generous for a real
    // SMTP handshake, and register/forgot-password no longer await this send anyway (see
    // routes/auth.js), so this only bounds how long the background attempt can run for.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

const sendViaSmtp = async ({ to, subject, html }) => {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    throw new Error('Email provider is not configured');
  }
  await transporter.sendMail({ from: process.env.EMAIL_FROM || 'LinguaNest <no-reply@linguanest.uz>', to, subject, html });
};

// Prefer Bird's HTTP API whenever a key is configured (see sendViaBirdApi for why); SMTP stays
// as a fallback for other providers or environments that don't block those ports.
const sendEmail = async (message) => {
  if (process.env.BIRD_API_KEY) {
    return sendViaBirdApi(message);
  }
  return sendViaSmtp(message);
};

const makeSafeEmailResult = (previewUrl, error) => ({
  delivered: false,
  previewUrl,
  ...(error ? { error } : {}),
});

export const sendVerificationEmail = async ({ user, token }) => {
  const verificationUrl = buildVerificationUrl(user.email, token);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your LinguaNest email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #102a43;">
          <h1 style="margin-bottom: 12px;">Welcome to LinguaNest</h1>
          <p style="font-size: 16px; line-height: 1.5;">Hi ${user.firstName}, please verify your email address to activate your account and start learning.</p>
          <p style="margin: 24px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700;">Verify email</a>
          </p>
          <p style="font-size: 14px; color: #486581;">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
        </div>
      `,
    });

    return { delivered: true, previewUrl: verificationUrl };
  } catch (error) {
    const message = error.response?.data?.errors?.[0]?.message || error.message || 'Email delivery failed';
    console.warn(`Verification email delivery failed for ${user.email}: ${message}`);
    return makeSafeEmailResult(verificationUrl, message);
  }
};

export const sendPasswordResetEmail = async ({ user, token }) => {
  const resetUrl = buildPasswordResetUrl(user.email, token);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your LinguaNest password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #102a43;">
          <h1 style="margin-bottom: 12px;">Reset your password</h1>
          <p style="font-size: 16px; line-height: 1.5;">Hi ${user.firstName}, use the link below to create a new password for your LinguaNest account.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700;">Reset password</a>
          </p>
          <p style="font-size: 14px; color: #486581;">This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
    });

    return { delivered: true, previewUrl: resetUrl };
  } catch (error) {
    const message = error.response?.data?.errors?.[0]?.message || error.message || 'Email delivery failed';
    console.warn(`Password reset email delivery failed for ${user.email}: ${message}`);
    return makeSafeEmailResult(resetUrl, message);
  }
};

export const EmailService = {
  getProviderStatus: getEmailProviderStatus,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
