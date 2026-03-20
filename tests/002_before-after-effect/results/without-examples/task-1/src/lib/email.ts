import nodemailer from "nodemailer";
import crypto from "crypto";

// HTML escape to prevent XSS in email templates
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });
}

const FROM = process.env.SMTP_FROM ?? "TaskFlow <noreply@taskflow.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  token: string;
}): Promise<void> {
  const { email, token } = params;
  const name = escapeHtml(params.name);
  const safeEmail = escapeHtml(email);

  // Build reset URL - token is URL-encoded, not rendered as HTML
  const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const safeResetUrl = escapeHtml(resetUrl);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">Reset Your Password</h1>
  <p>Hello ${name},</p>
  <p>We received a request to reset the password for your TaskFlow account (${safeEmail}).</p>
  <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
  <p style="margin: 30px 0;">
    <a href="${safeResetUrl}"
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Reset Password
    </a>
  </p>
  <p>If you did not request a password reset, please ignore this email. Your password will not be changed.</p>
  <p>If the button above doesn't work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #4b5563;">${safeResetUrl}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">TaskFlow - Task Management</p>
</body>
</html>`;

  const text = `Reset Your Password\n\nHello ${params.name},\n\nClick this link to reset your password (expires in 1 hour):\n${resetUrl}\n\nIf you did not request a password reset, please ignore this email.`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html,
    text,
  });
}

export async function sendInviteEmail(params: {
  email: string;
  inviterName: string;
  teamName: string;
  token: string;
}): Promise<void> {
  const { email, token } = params;
  // Escape all user-provided data before embedding in HTML
  const inviterName = escapeHtml(params.inviterName);
  const teamName = escapeHtml(params.teamName);

  const acceptUrl = `${APP_URL}/teams/invite?token=${encodeURIComponent(token)}`;
  const safeAcceptUrl = escapeHtml(acceptUrl);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1a1a1a;">You've been invited to join a team!</h1>
  <p><strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong> on TaskFlow.</p>
  <p>Click the button below to accept the invitation. This link will expire in <strong>7 days</strong>.</p>
  <p style="margin: 30px 0;">
    <a href="${safeAcceptUrl}"
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Accept Invitation
    </a>
  </p>
  <p>If you don't want to join this team, you can safely ignore this email.</p>
  <p>If the button above doesn't work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #4b5563;">${safeAcceptUrl}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">TaskFlow - Task Management</p>
</body>
</html>`;

  const text = `You've been invited!\n\n${params.inviterName} has invited you to join ${params.teamName} on TaskFlow.\n\nAccept invitation: ${acceptUrl}\n\nThis link expires in 7 days.`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to join ${params.teamName} on TaskFlow`,
    html,
    text,
  });
}

export async function sendSuspiciousLoginEmail(params: {
  email: string;
  name: string;
  country: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  reasons: string[];
}): Promise<void> {
  const { email } = params;
  const name = escapeHtml(params.name);
  const country = params.country ? escapeHtml(params.country) : "Unknown";
  const ipAddress = params.ipAddress ? escapeHtml(params.ipAddress) : "Unknown";
  const userAgent = params.userAgent ? escapeHtml(params.userAgent) : "Unknown";
  const reasons = params.reasons.map((r) => escapeHtml(r));

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suspicious Login Detected</title>
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #dc2626;">Suspicious Login Detected</h1>
  <p>Hello ${name},</p>
  <p>We detected a suspicious login to your TaskFlow account. Here are the details:</p>
  <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
    <tr style="background-color: #f9fafb;">
      <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Country</strong></td>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${country}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>IP Address</strong></td>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${ipAddress}</td>
    </tr>
    <tr style="background-color: #f9fafb;">
      <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Device</strong></td>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${userAgent}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Time</strong></td>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(new Date().toISOString())}</td>
    </tr>
  </table>
  <p><strong>Reasons flagged:</strong></p>
  <ul>
    ${reasons.map((r) => `<li>${r}</li>`).join("")}
  </ul>
  <p>If this was you, no action is required. If you don't recognize this login, please:</p>
  <ol>
    <li>Change your password immediately</li>
    <li>Review your active sessions</li>
    <li>Contact support if needed</li>
  </ol>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">TaskFlow - Task Management</p>
</body>
</html>`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Suspicious login detected on your TaskFlow account",
    html,
    text: `Suspicious login detected on your account.\n\nCountry: ${params.country}\nIP: ${params.ipAddress}\nTime: ${new Date().toISOString()}\n\nReasons: ${params.reasons.join(", ")}`,
  });
}

// Webhook signature verification
export async function verifyWebhookSignature(req: Request): Promise<void> {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("WEBHOOK_SECRET not configured");
  }

  const signature = req.headers.get("x-webhook-signature");
  if (!signature) {
    throw new Error("Missing webhook signature");
  }

  const body = await req.text();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expectedBuffer = Buffer.from(`sha256=${expectedSignature}`);
  const receivedBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new Error("Invalid webhook signature");
  }
}

export async function processWebhook(eventId: string): Promise<void> {
  const { prisma } = await import("./prisma");

  // Idempotency check
  const existing = await prisma.webhookEvent.findUnique({
    where: { externalId: eventId },
  });

  if (existing?.processedAt) {
    return; // Already processed
  }

  await prisma.webhookEvent.upsert({
    where: { externalId: eventId },
    create: {
      externalId: eventId,
      status: "processing",
    },
    update: {
      status: "processing",
    },
  });

  try {
    // Process the webhook event here
    // ... actual processing logic would go here

    await prisma.webhookEvent.update({
      where: { externalId: eventId },
      data: {
        status: "processed",
        processedAt: new Date(),
      },
    });
  } catch {
    await prisma.webhookEvent.update({
      where: { externalId: eventId },
      data: { status: "failed" },
    });
    throw new Error("Webhook processing failed");
  }
}
