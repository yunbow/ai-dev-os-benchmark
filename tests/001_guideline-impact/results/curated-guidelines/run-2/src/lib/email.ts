import nodemailer from "nodemailer";

export function escapeHtml(unsafe: string): string {
  return unsafe
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
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  const safeEmail = escapeHtml(email);

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>We received a request to reset the password for your TaskFlow account associated with <strong>${safeEmail}</strong>.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Or copy this link: ${escapeHtml(resetUrl)}</p>
      </div>
    `,
    text: `Reset your TaskFlow password\n\nClick here: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  token: string
): Promise<void> {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `You've been invited to join ${teamName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p><strong>${safeInviterName}</strong> has invited you to join the <strong>${safeTeamName}</strong> team on TaskFlow.</p>
        <p>Click the button below to accept the invitation. This link expires in 7 days.</p>
        <a href="${inviteUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Accept Invitation
        </a>
        <p>Or copy this link: ${escapeHtml(inviteUrl)}</p>
      </div>
    `,
    text: `You've been invited to join ${teamName} on TaskFlow\n\nAccept invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
  });
}
