// Email utility for sending password reset and invitation emails
// In production, replace with a proper email service (SendGrid, Resend, etc.)

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`[Email] To: ${to}\nSubject: ${subject}\n${html}`);
    return;
  }

  // Production: use SMTP or email service
  // This is a stub - replace with actual email sending logic
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.warn("[Email] SMTP_HOST not configured, skipping email send");
    return;
  }

  // TODO: Implement actual email sending with nodemailer or similar
  console.log(`[Email] Would send to: ${to}, Subject: ${subject}`);
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  appUrl: string
): Promise<void> {
  const resetUrl = `${appUrl}/reset-password/${encodeURIComponent(resetToken)}`;
  const safeEmail = escapeHtml(email);

  return sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset the password for the account associated with ${safeEmail}.</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p>For security, never share this link with anyone.</p>
    `,
  });
}

export function sendTeamInvitationEmail(params: {
  to: string;
  teamName: string;
  inviterName: string;
  inviteToken: string;
  appUrl: string;
}): Promise<void> {
  const { to, teamName, inviterName, inviteToken, appUrl } = params;
  const inviteUrl = `${appUrl}/teams/invite/${encodeURIComponent(inviteToken)}`;

  // Escape user-supplied values to prevent HTML injection
  const safeTeamName = escapeHtml(teamName);
  const safeInviterName = escapeHtml(inviterName);

  return sendEmail({
    to,
    subject: `You've been invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <h2>Team Invitation</h2>
      <p>${safeInviterName} has invited you to join <strong>${safeTeamName}</strong> on TaskFlow.</p>
      <p>Click the link below to accept the invitation. This invitation expires in 7 days.</p>
      <p><a href="${inviteUrl}">Accept Invitation</a></p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    `,
  });
}
