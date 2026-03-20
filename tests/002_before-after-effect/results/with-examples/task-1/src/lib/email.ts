import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Escape all user-originated values before embedding in HTML emails
// to prevent HTML injection attacks.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const FROM = process.env.SMTP_FROM ?? "TaskFlow <noreply@example.com>";

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  // resetUrl is a system-generated URL — escape it anyway for safety
  const safeUrl = encodeURI(resetUrl);

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <p>You requested a password reset for your TaskFlow account.</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${safeUrl}">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviterName: string,
  inviteUrl: string,
): Promise<void> {
  // Escape user-originated values (team name and inviter name are set by users)
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);
  const safeUrl = encodeURI(inviteUrl);

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <p><strong>${safeInviterName}</strong> has invited you to join
      the team <strong>${safeTeamName}</strong> on TaskFlow.</p>
      <p><a href="${safeUrl}">Accept Invitation</a></p>
      <p>This invitation expires in 7 days.</p>
    `,
  });
}

export async function sendSuspiciousLoginEmail(params: {
  email: string;
  ip: string | null;
  country: string | null;
  browser: string | null;
  os: string | null;
}): Promise<void> {
  const safeIp = escapeHtml(params.ip ?? "Unknown");
  const safeCountry = escapeHtml(params.country ?? "Unknown");
  const safeBrowser = escapeHtml(params.browser ?? "Unknown");
  const safeOs = escapeHtml(params.os ?? "Unknown");

  await transporter.sendMail({
    from: FROM,
    to: params.email,
    subject: "Suspicious login detected on your TaskFlow account",
    html: `
      <p>We detected a login to your TaskFlow account from an unfamiliar location.</p>
      <ul>
        <li>IP Address: ${safeIp}</li>
        <li>Country: ${safeCountry}</li>
        <li>Browser: ${safeBrowser}</li>
        <li>OS: ${safeOs}</li>
      </ul>
      <p>If this was you, you can ignore this email. If not, please change your password immediately.</p>
    `,
  });
}
