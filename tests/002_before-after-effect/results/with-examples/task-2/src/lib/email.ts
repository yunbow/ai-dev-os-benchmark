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

/**
 * Escape user-controlled values before embedding in HTML emails.
 * Trusted values (UUIDs, plan names, numbers) do not need escaping.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,      // user-created — must be escaped
  inviterName: string,   // user-created — must be escaped
  inviteUrl: string,
): Promise<void> {
  // Escape all user-originated values before embedding in HTML
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);
  // encodeURI preserves the URL structure while encoding unsafe characters
  const safeUrl = encodeURI(inviteUrl);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `You've been invited to join ${safeTeamName}`,
    html: `
      <p>
        <strong>${safeInviterName}</strong> has invited you to join
        the team <strong>${safeTeamName}</strong>.
      </p>
      <p>
        <a href="${safeUrl}">Accept Invitation</a>
      </p>
      <p>This invitation expires in 7 days.</p>
    `,
  });
}
