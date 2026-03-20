import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  // HTML is constructed with static strings only — no raw user input injected
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your TaskFlow account.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>The link will expire in 1 hour.</p>
      </div>
    `,
    text: `Reset your TaskFlow password\n\nClick this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  inviteUrl: string
): Promise<void> {
  // teamName and inviterName are from database records, not raw user HTTP input
  // inviteUrl is constructed server-side from a generated token
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `You've been invited to join ${teamName} on TaskFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong> on TaskFlow.</p>
        <p>Click the button below to accept the invitation. This link expires in 7 days.</p>
        <a href="${inviteUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Accept Invitation
        </a>
        <p>If you were not expecting this invitation, you can safely ignore this email.</p>
      </div>
    `,
    text: `You've been invited to join ${teamName} on TaskFlow.\n\nAccept invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
  });
}
