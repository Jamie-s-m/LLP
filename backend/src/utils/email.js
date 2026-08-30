import nodemailer from 'nodemailer';

const getFrontendAppUrl = () =>
  String(process.env.FRONTEND_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

// Pure URL construction, no network I/O - callers that want the link immediately (without
// waiting for an actual send attempt against a possibly slow/unreachable SMTP host) can use
// these directly instead of awaiting sendVerificationEmail/sendPasswordResetEmail.
export const buildVerificationUrl = (email, token) =>
  `${getFrontendAppUrl()}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

export const buildPasswordResetUrl = (email, token) =>
  `${getFrontendAppUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

export const getEmailProviderStatus = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  const configured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

  return {
    configured,
    provider: configured ? 'smtp' : 'unconfigured',
    from: EMAIL_FROM || 'LinguaNest <no-reply@linguanest.uz>',
    mode: String(process.env.NODE_ENV || 'development').toLowerCase(),
  };
};

const getTransporter = () => {
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
    // refusing the connection) makes sendMail hang indefinitely - and register/forgot-password
    // await it before responding, so an unreachable SMTP host takes the whole request down
    // with it. Confirmed in production: registration hung 60s+ with no response until these
    // were added. 10s is generous for a real SMTP handshake and keeps registration/reset
    // responsive even when mail delivery itself is degraded.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

const makeSafeEmailResult = (previewUrl, error) => ({
  delivered: false,
  previewUrl,
  ...(error ? { error } : {}),
});

export const sendVerificationEmail = async ({ user, token }) => {
  const verificationUrl = buildVerificationUrl(user.email, token);
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`Email transport is not configured. Verification URL for ${user.email}: ${verificationUrl}`);
    return makeSafeEmailResult(verificationUrl, 'Email provider is not configured');
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'LinguaNest <no-reply@linguanest.uz>',
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
    console.warn(`Verification email delivery failed for ${user.email}: ${error.message || error}`);
    return makeSafeEmailResult(verificationUrl, error.message || 'Email delivery failed');
  }
};

export const sendPasswordResetEmail = async ({ user, token }) => {
  const resetUrl = buildPasswordResetUrl(user.email, token);
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`Email transport is not configured. Password reset URL for ${user.email}: ${resetUrl}`);
    return makeSafeEmailResult(resetUrl, 'Email provider is not configured');
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'LinguaNest <no-reply@linguanest.uz>',
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
    console.warn(`Password reset email delivery failed for ${user.email}: ${error.message || error}`);
    return makeSafeEmailResult(resetUrl, error.message || 'Email delivery failed');
  }
};

export const EmailService = {
  getProviderStatus: getEmailProviderStatus,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
