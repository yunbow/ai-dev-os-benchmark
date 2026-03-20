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
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT ?? "587"),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetLink: string;
  userName?: string;
}): Promise<void> {
  const transporter = createTransporter();
  const safeName = params.userName ? escapeHtml(params.userName) : "there";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "noreply@taskflow.app",
    to: params.to,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${safeName},</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${params.resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendTeamInvitationEmail(params: {
  to: string;
  teamName: string;
  inviterName: string;
  inviteLink: string;
}): Promise<void> {
  const transporter = createTransporter();
  const safeTeamName = escapeHtml(params.teamName);
  const safeInviterName = escapeHtml(params.inviterName);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "noreply@taskflow.app",
    to: params.to,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p>${safeInviterName} has invited you to join <strong>${safeTeamName}</strong> on TaskFlow.</p>
        <p>This invitation expires in 7 days.</p>
        <a href="${params.inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
          Accept Invitation
        </a>
      </div>
    `,
  });
}
