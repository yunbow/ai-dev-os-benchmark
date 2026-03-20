// src/lib/email.ts

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Escape user-derived data to prevent HTML injection in emails (Security §3.6)
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface TeamInvitationEmailParams {
  to: string;
  teamName: string;
  inviterName: string;
  acceptUrl: string;
}

export async function sendTeamInvitationEmail(
  params: TeamInvitationEmailParams
): Promise<void> {
  // teamName and inviterName are user-provided free-text — must be escaped (Security §3.6)
  // to and acceptUrl are system-generated (UUID token, base URL) — no escaping needed
  const safeTeamName = escapeHtml(params.teamName);
  const safeInviterName = escapeHtml(params.inviterName);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>You've been invited to join <strong>${safeTeamName}</strong></h2>
  <p>${safeInviterName} has invited you to join their team on our platform.</p>
  <p>This invitation expires in <strong>7 days</strong>.</p>
  <p style="margin: 32px 0;">
    <a href="${params.acceptUrl}"
       style="background-color: #0070f3; color: #fff; padding: 12px 24px;
              text-decoration: none; border-radius: 6px; font-weight: bold;">
      Accept Invitation
    </a>
  </p>
  <p style="font-size: 12px; color: #666;">
    If you did not expect this invitation, you can safely ignore this email.
  </p>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@example.com",
    to: params.to,
    subject: `You've been invited to join ${safeTeamName}`,
    html,
  });
}
