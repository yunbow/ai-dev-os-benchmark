import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM = process.env.SMTP_FROM ?? "TaskFlow <noreply@taskflow.app>";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  inviteUrl: string
) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to join ${teamName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(teamName)}</strong> on TaskFlow.</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
          Accept Invitation
        </a>
        <p>This invitation expires in 7 days. If you did not expect this invitation, you can ignore this email.</p>
      </div>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
