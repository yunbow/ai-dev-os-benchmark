import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4f46e5;">TaskFlow Password Reset</h1>
      <p>You requested a password reset. Click the button below to reset your password.</p>
      <p>This link will expire in 1 hour.</p>
      <a href="${resetUrl}"
         style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Reset Password
      </a>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #4f46e5;">${resetUrl}</p>
    </body>
    </html>
  `;
}

export function getTeamInvitationEmailHtml(
  teamName: string,
  inviteUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4f46e5;">TaskFlow Team Invitation</h1>
      <p>You have been invited to join the team <strong>${teamName}</strong> on TaskFlow.</p>
      <p>This invitation will expire in 7 days.</p>
      <a href="${inviteUrl}"
         style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Accept Invitation
      </a>
      <p>If you did not expect this invitation, please ignore this email.</p>
    </body>
    </html>
  `;
}
