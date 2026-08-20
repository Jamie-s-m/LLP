import nodemailer from 'nodemailer';

const getFrontendAppUrl = () =>
  String(process.env.FRONTEND_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

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
  });
};

export const sendVerificationEmail = async ({ user, token }) => {
  const verificationUrl = `${getFrontendAppUrl()}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`Email transport is not configured. Verification URL for ${user.email}: ${verificationUrl}`);
    return { delivered: false, previewUrl: verificationUrl };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Auralex <no-reply@auralex.app>',
    to: user.email,
    subject: 'Verify your Auralex email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #102a43;">
        <h1 style="margin-bottom: 12px;">Welcome to Auralex</h1>
        <p style="font-size: 16px; line-height: 1.5;">Hi ${user.firstName}, please verify your email address to activate your account and start learning.</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: #f26b5b; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700;">Verify email</a>
        </p>
        <p style="font-size: 14px; color: #486581;">This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });

  return { delivered: true, previewUrl: verificationUrl };
};

export const sendPasswordResetEmail = async ({ user, token }) => {
  const resetUrl = `${getFrontendAppUrl()}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`Email transport is not configured. Password reset URL for ${user.email}: ${resetUrl}`);
    return { delivered: false, previewUrl: resetUrl };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Auralex <no-reply@auralex.app>',
    to: user.email,
    subject: 'Reset your Auralex password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #102a43;">
        <h1 style="margin-bottom: 12px;">Reset your password</h1>
        <p style="font-size: 16px; line-height: 1.5;">Hi ${user.firstName}, use the link below to create a new password for your Auralex account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #102a43; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700;">Reset password</a>
        </p>
        <p style="font-size: 14px; color: #486581;">This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });

  return { delivered: true, previewUrl: resetUrl };
};
