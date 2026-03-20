import nodemailer from "nodemailer";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: SendEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "TaskFlow <noreply@taskflow.app>",
    ...options,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  userName: string | null,
  resetToken: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const safeEmail = escapeHtml(email);
  const safeName = escapeHtml(userName ?? "there");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Password Reset Request</h1>
  <p>Hi ${safeName},</p>
  <p>We received a request to reset the password for the TaskFlow account associated with ${safeEmail}.</p>
  <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}"
       style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Reset Password
    </a>
  </p>
  <p>If you didn't request this, you can safely ignore this email. Your password won't change.</p>
  <p>If the button doesn't work, copy and paste this URL into your browser:</p>
  <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #666; font-size: 14px;">This is an automated message from TaskFlow. Please do not reply to this email.</p>
</body>
</html>
  `.trim();

  await sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html,
  });
}

export async function sendTeamInvitationEmail(
  recipientEmail: string,
  inviterName: string | null,
  teamName: string,
  inviteToken: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appUrl}/teams/accept-invite?token=${encodeURIComponent(inviteToken)}`;
  const safeEmail = escapeHtml(recipientEmail);
  const safeInviterName = escapeHtml(inviterName ?? "Someone");
  const safeTeamName = escapeHtml(teamName);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join a team</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Team Invitation</h1>
  <p>Hi ${safeEmail},</p>
  <p><strong>${safeInviterName}</strong> has invited you to join the <strong>${safeTeamName}</strong> team on TaskFlow.</p>
  <p>Click the button below to accept the invitation. This link is valid for <strong>7 days</strong>.</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${acceptUrl}"
       style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Accept Invitation
    </a>
  </p>
  <p>If you don't have a TaskFlow account yet, you'll be prompted to create one after clicking the link.</p>
  <p>If you didn't expect this invitation, you can safely ignore this email.</p>
  <p>If the button doesn't work, copy and paste this URL into your browser:</p>
  <p style="word-break: break-all; color: #6366f1;">${acceptUrl}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #666; font-size: 14px;">This is an automated message from TaskFlow. Please do not reply to this email.</p>
</body>
</html>
  `.trim();

  await sendEmail({
    to: recipientEmail,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html,
  });
}
