import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    text: `Click the link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your TaskFlow password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
        <p style="margin-top:16px;color:#6b7280;font-size:14px;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  token: string
) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/teams/accept-invite?token=${encodeURIComponent(token)}`;
  // Sanitize display values to prevent HTML injection
  const safeTeamName = teamName.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const safeInviterName = inviterName.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `You've been invited to join ${teamName} on TaskFlow`,
    text: `${inviterName} has invited you to join "${teamName}" on TaskFlow.\n\nAccept the invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to TaskFlow</h2>
        <p><strong>${safeInviterName}</strong> has invited you to join <strong>${safeTeamName}</strong>.</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;">Accept Invitation</a>
        <p style="margin-top:16px;color:#6b7280;font-size:14px;">This invitation expires in 7 days. If you did not expect this, you can ignore it.</p>
      </div>
    `,
  });
}
