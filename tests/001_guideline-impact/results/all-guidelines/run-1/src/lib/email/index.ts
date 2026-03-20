import nodemailer from "nodemailer";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Password Reset Request - TaskFlow",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p>
          <a href="${escapeHtml(resetUrl)}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  invitationToken: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invitations/${invitationToken}`;

  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p>${safeInviterName} has invited you to join <strong>${safeTeamName}</strong> on TaskFlow.</p>
        <p>
          <a href="${escapeHtml(inviteUrl)}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>This invitation will expire in 7 days.</p>
        <p>If you did not expect this invitation, please ignore this email.</p>
      </div>
    `,
  });
}
