import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM ?? "noreply@taskflow.app";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  token: string,
) {
  const inviteUrl = `${process.env.AUTH_URL}/invite?token=${encodeURIComponent(token)}`;
  const safeTeamName = teamName.replace(/[<>&"']/g, "");
  const safeInviterName = inviterName.replace(/[<>&"']/g, "");

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p>${safeInviterName} has invited you to join <strong>${safeTeamName}</strong> on TaskFlow.</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Accept Invitation</a>
        <p>This invitation expires in 7 days.</p>
      </div>
    `,
    text: `You've been invited to join ${safeTeamName} on TaskFlow by ${safeInviterName}.\n\nAccept invitation: ${inviteUrl}\n\nThis invitation expires in 7 days.`,
  });
}
