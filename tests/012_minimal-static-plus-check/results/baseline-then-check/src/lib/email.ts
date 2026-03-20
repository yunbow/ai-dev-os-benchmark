import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "TaskFlow <noreply@taskflow.app>",
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">TaskFlow Password Reset</h1>
        <p>You requested a password reset for your TaskFlow account.</p>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
        <p>If you did not request this reset, please ignore this email.</p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">TaskFlow - Task Management Application</p>
      </body>
      </html>
    `,
    text: `Reset your TaskFlow password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  token: string,
  teamName: string,
  senderName: string
): Promise<void> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`;

  await sendEmail({
    to: email,
    subject: `You're invited to join ${teamName} on TaskFlow`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4F46E5;">You're Invited!</h1>
        <p>${senderName} has invited you to join <strong>${teamName}</strong> on TaskFlow.</p>
        <p>Click the button below to accept the invitation. This link is valid for 7 days.</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Accept Invitation</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${inviteUrl}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">TaskFlow - Task Management Application</p>
      </body>
      </html>
    `,
    text: `You've been invited to join ${teamName} on TaskFlow by ${senderName}.\n\nAccept the invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
  });
}
