import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "TaskFlow <noreply@taskflow.app>",
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export function getPasswordResetEmailHtml(resetUrl: string, userName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 40px; border: 1px solid #e9ecef;">
    <h1 style="color: #1a1a2e; margin-top: 0;">Reset Your Password</h1>
    <p>Hi ${escapeHtml(userName)},</p>
    <p>You requested a password reset for your TaskFlow account. Click the button below to reset your password. This link will expire in 1 hour.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(resetUrl)}"
         style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6366f1;">${escapeHtml(resetUrl)}</p>
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
    <p style="font-size: 12px; color: #6c757d;">This email was sent by TaskFlow. If you have questions, contact support.</p>
  </div>
</body>
</html>
  `.trim();
}

export function getTeamInvitationEmailHtml(
  inviteUrl: string,
  teamName: string,
  inviterName: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 40px; border: 1px solid #e9ecef;">
    <h1 style="color: #1a1a2e; margin-top: 0;">You're Invited to Join a Team!</h1>
    <p>${escapeHtml(inviterName)} has invited you to join the <strong>${escapeHtml(teamName)}</strong> team on TaskFlow.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${escapeHtml(inviteUrl)}"
         style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
        Accept Invitation
      </a>
    </div>
    <p>This invitation will expire in 7 days.</p>
    <p>If you don't have a TaskFlow account yet, you'll be prompted to create one.</p>
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
    <p style="font-size: 12px; color: #6c757d;">This invitation was sent by TaskFlow on behalf of ${escapeHtml(inviterName)}.</p>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
