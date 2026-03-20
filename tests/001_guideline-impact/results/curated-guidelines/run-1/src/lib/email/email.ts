import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const safeEmail = escapeHtml(email);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <p>Hi,</p>
      <p>We received a request to reset the password for your TaskFlow account (${safeEmail}).</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviteUrl: string
): Promise<void> {
  const safeTeamName = escapeHtml(teamName);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <p>Hi,</p>
      <p>You have been invited to join the team <strong>${safeTeamName}</strong> on TaskFlow.</p>
      <p>Click the link below to accept the invitation. This link expires in 7 days.</p>
      <p><a href="${inviteUrl}">Accept Invitation</a></p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    `,
  });
}
