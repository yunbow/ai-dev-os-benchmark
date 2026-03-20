// src/lib/email/send-invitation-email.ts

// SEC-16: HTML injection prevention — escape all user-derived data before embedding in HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface SendInvitationEmailParams {
  to: string;
  inviterDisplayName: string;
  invitationToken: string;
}

export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<void> {
  const { to, inviterDisplayName, invitationToken } = params;

  // SEC-04: Base URL comes from an environment variable, never hardcoded
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL environment variable is not set");
  }

  // Build the accept URL; the token is URL-safe hex so no additional encoding needed
  const acceptUrl = `${appBaseUrl}/invitations/accept?token=${invitationToken}`;

  // SEC-16: Escape the inviter's display name (free-text) before embedding in HTML
  const safeInviterName = escapeHtml(inviterDisplayName);

  const html = buildInvitationHtml({ safeInviterName, acceptUrl });
  const text = buildInvitationText({ inviterDisplayName, acceptUrl });

  await sendEmail({ to, subject: `${inviterDisplayName} invited you to join their team`, html, text });
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

interface TemplateVars {
  safeInviterName: string;
  acceptUrl: string;
}

function buildInvitationHtml({ safeInviterName, acceptUrl }: TemplateVars): string {
  // acceptUrl is constructed from env vars + a hex token — no escaping required,
  // but we still attribute-escape it defensively for the href.
  const safeAcceptUrl = acceptUrl.replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Team Invitation</title>
</head>
<body style="font-family: sans-serif; color: #111;">
  <p>Hi,</p>
  <p><strong>${safeInviterName}</strong> has invited you to join their team.</p>
  <p>
    <a href="${safeAcceptUrl}" style="display:inline-block;padding:12px 24px;background:#0070f3;color:#fff;text-decoration:none;border-radius:4px;">
      Accept Invitation
    </a>
  </p>
  <p>This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.</p>
</body>
</html>`;
}

function buildInvitationText({
  inviterDisplayName,
  acceptUrl,
}: {
  inviterDisplayName: string;
  acceptUrl: string;
}): string {
  return `${inviterDisplayName} has invited you to join their team.\n\nAccept the invitation: ${acceptUrl}\n\nThis invitation expires in 7 days.`;
}

// ---------------------------------------------------------------------------
// Generic email sender (replace with your mailer SDK, e.g. Resend / SendGrid)
// ---------------------------------------------------------------------------

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  // SEC-04: API key comes from an environment variable
  const apiKey = process.env.EMAIL_API_KEY;
  if (!apiKey) {
    throw new Error("EMAIL_API_KEY environment variable is not set");
  }

  // Replace the block below with your actual mailer SDK call.
  // Example shown uses a generic fetch-based approach:
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    // SEC-17: Do not surface provider response bodies to callers
    throw new Error(`Email delivery failed (status ${response.status})`);
  }
}
