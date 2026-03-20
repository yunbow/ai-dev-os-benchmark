import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || "TaskFlow <noreply@taskflow.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Reset your password</h1>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  token: string
): Promise<void> {
  const inviteUrl = `${APP_URL}/invite?token=${token}`;
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Team Invitation</h1>
        <p>${safeInviterName} has invited you to join <strong>${safeTeamName}</strong> on TaskFlow.</p>
        <p>This invitation expires in 7 days.</p>
        <a href="${inviteUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      </div>
    `,
  });
}
