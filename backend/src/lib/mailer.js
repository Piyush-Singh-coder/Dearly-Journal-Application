import nodemailer from "nodemailer";

/**
 * Sends a verification email to a new user.
 * Configure SMTP credentials in your .env file.
 */
export const sendVerificationEmail = async (toEmail, token) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // Use true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Dearly" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Verify your Dearly account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to Dearly 📔</h2>
        <p>Thanks for signing up! Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #6366f1;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 12px;
        ">Verify Email</a>
        <p style="margin-top:16px; color: #888; font-size:12px;">
          If you didn't create an account, you can safely ignore this email.
          This link expires in 24 hours.
        </p>
      </div>
    `,
  });
};

/**
 * Sends a team notebook invitation email.
 * @param {string} toEmail - Recipient email
 * @param {string} notebookTitle - Name of the journal being shared
 * @param {string} token - Invite token
 * @param {object} inviter - User object of the person sending the invite
 */
// Escape user-controlled strings before inserting into HTML email templates
const htmlEscape = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendInviteEmail = async (
  toEmail,
  notebookTitle,
  token,
  inviter,
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const joinUrl = `${process.env.CLIENT_URL}/join/${token}`;
  const inviterName = htmlEscape(inviter.fullName || inviter.email);
  const safeTitle = htmlEscape(notebookTitle);

  await transporter.sendMail({
    from: `"Dearly" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `${inviter.fullName || inviter.email} invited you to journal together on Dearly`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>You're invited to collaborate 📓</h2>
        <p><strong>${inviterName}</strong> has invited you to join their journal
          <strong>"${safeTitle}"</strong> on Dearly.</p>
        <a href="${joinUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background: #6366f1;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 12px;
        ">Accept Invitation</a>
        <p style="margin-top:16px; color: #888; font-size:12px;">
          This invite link expires in 7 days. If you don't know this person, ignore this email.
        </p>
      </div>
    `,
  });
};
