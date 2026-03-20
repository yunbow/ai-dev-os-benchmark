import nodemailer from "nodemailer";

// Escape HTML to prevent injection in email templates
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Fallback to ethereal (test account) in development
    if (process.env.NODE_ENV === "development") {
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER ?? "",
          pass: process.env.ETHEREAL_PASS ?? "",
        },
      });
    }
    throw new Error("SMTP configuration is missing.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME ?? "TaskFlow";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? "noreply@taskflow.app";

  await transporter.sendMail({
    from: `"${escapeHtml(fromName)}" <${fromAddress}>`,
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const safeEmail = escapeHtml(email);

  await sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a;">Reset Your Password</h1>
          <p>We received a request to reset the password for the TaskFlow account associated with <strong>${safeEmail}</strong>.</p>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 12px;">
            Or copy this link: ${resetUrl}
          </p>
        </body>
      </html>
    `,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appUrl}/teams/accept-invite?token=${encodeURIComponent(token)}`;
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);

  await sendEmail({
    to: email,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a;">Team Invitation</h1>
          <p><strong>${safeInviterName}</strong> has invited you to join the team <strong>${safeTeamName}</strong> on TaskFlow.</p>
          <p>Click the button below to accept the invitation. This link expires in 7 days.</p>
          <a href="${acceptUrl}"
             style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px;">
            If you do not want to join this team, you can safely ignore this email.
          </p>
        </body>
      </html>
    `,
    text: `${safeInviterName} invited you to join ${safeTeamName} on TaskFlow. Accept here: ${acceptUrl}`,
  });
}
