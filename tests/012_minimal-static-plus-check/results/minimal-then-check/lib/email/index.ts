function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // In production, integrate with Resend, SendGrid, etc.
  // For now, log to console in dev
  if (process.env.NODE_ENV === "development") {
    console.log("[EMAIL]", opts);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const safeEmail = escapeHtml(email);
  await sendEmail({
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <h1>Password Reset</h1>
      <p>Hi ${safeEmail},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
}

export async function sendTeamInvitationEmail(
  email: string,
  teamName: string,
  inviteUrl: string
): Promise<void> {
  const safeTeamName = escapeHtml(teamName);
  await sendEmail({
    to: email,
    subject: `You're invited to join ${safeTeamName} on TaskFlow`,
    html: `
      <h1>Team Invitation</h1>
      <p>You've been invited to join <strong>${safeTeamName}</strong>.</p>
      <p>Click the link below to accept. This link expires in 7 days.</p>
      <a href="${inviteUrl}">Accept Invitation</a>
    `,
  });
}
