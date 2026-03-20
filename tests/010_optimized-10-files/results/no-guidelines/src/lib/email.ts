import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function createTransporter() {
  if (process.env.NODE_ENV === "test" || !process.env.SMTP_HOST) {
    // Return a test account transporter for development
    return nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false,
      ignoreTLS: true,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM ?? "TaskFlow <noreply@taskflow.app>";

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

// Safely escape HTML - prevent XSS in email bodies
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/forgot-password?token=${encodeURIComponent(token)}`;
  const safeUserName = escapeHtml(userName);
  const safeEmail = escapeHtml(email);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your TaskFlow password</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h1 style="color: #4F46E5;">Reset your password</h1>
  <p>Hello ${safeUserName},</p>
  <p>We received a request to reset the password for your TaskFlow account associated with ${safeEmail}.</p>
  <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Reset Password
    </a>
  </div>
  <p>If you didn't request a password reset, you can safely ignore this email.</p>
  <p>For security, this link will expire in 1 hour.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">TaskFlow - Task Management Application</p>
</body>
</html>
  `.trim();

  const text = `
Reset your TaskFlow password

Hello ${userName},

We received a request to reset the password for your TaskFlow account associated with ${email}.

Click the link below to reset your password. This link will expire in 1 hour.

${resetUrl}

If you didn't request a password reset, you can safely ignore this email.
  `.trim();

  await sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html,
    text,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  token: string
): Promise<void> {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/teams/accept?token=${encodeURIComponent(token)}`;
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to join a team on TaskFlow</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h1 style="color: #4F46E5;">Team Invitation</h1>
  <p>Hello,</p>
  <p><strong>${safeInviterName}</strong> has invited you to join the team <strong>${safeTeamName}</strong> on TaskFlow.</p>
  <p>Click the button below to accept the invitation. This invitation will expire in 7 days.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Accept Invitation
    </a>
  </div>
  <p>If you don't want to join this team, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  <p style="font-size: 12px; color: #666;">TaskFlow - Task Management Application</p>
</body>
</html>
  `.trim();

  const text = `
Team Invitation - TaskFlow

Hello,

${inviterName} has invited you to join the team "${teamName}" on TaskFlow.

Click the link below to accept the invitation. This invitation will expire in 7 days.

${inviteUrl}

If you don't want to join this team, you can safely ignore this email.
  `.trim();

  await sendEmail({
    to: email,
    subject: `You've been invited to join ${teamName} on TaskFlow`,
    html,
    text,
  });
}
