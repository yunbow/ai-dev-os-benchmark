// src/lib/email/invitation.ts

import { escapeHtml } from "@/lib/email";

interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  teamName: string;
  invitationToken: string;
}

/**
 * Sends an HTML invitation email to the invitee.
 *
 * Security notes:
 * - All user-derived values are HTML-escaped before embedding in the template.
 * - The accept URL is constructed from an env-var base URL, not from request headers,
 *   to prevent host-header injection.
 */
export async function sendInvitationEmail({
  to,
  inviterName,
  teamName,
  invitationToken,
}: SendInvitationEmailParams): Promise<void> {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appBaseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  // Build the accept link — token is URL-safe hex, no encoding needed,
  // but we validate it's the expected format as a defence-in-depth measure.
  if (!/^[0-9a-f]{64}$/.test(invitationToken)) {
    throw new Error("Invalid invitation token format");
  }

  const acceptUrl = `${appBaseUrl}/invitations/accept?token=${invitationToken}`;

  // Escape all user-derived data before embedding in HTML (section 3.6)
  const safeInviterName = escapeHtml(inviterName);
  const safeTeamName = escapeHtml(teamName);
  const safeAcceptUrl = escapeHtml(acceptUrl);
  const safeTo = escapeHtml(to);

  const html = buildInvitationHtml({
    inviterName: safeInviterName,
    teamName: safeTeamName,
    acceptUrl: safeAcceptUrl,
    recipientEmail: safeTo,
  });

  // Delegate to your transactional email provider (e.g. Resend, SendGrid).
  // Replace the block below with the actual SDK call for your project.
  await sendTransactionalEmail({
    to,
    subject: `${inviterName} invited you to join ${teamName}`,
    html,
  });
}

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------

interface TemplateParams {
  inviterName: string;
  teamName: string;
  acceptUrl: string;
  recipientEmail: string;
}

function buildInvitationHtml({
  inviterName,
  teamName,
  acceptUrl,
  recipientEmail,
}: TemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited</title>
  <style>
    body { font-family: sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff;
               border-radius: 8px; overflow: hidden; }
    .header  { background: #18181b; padding: 32px; text-align: center; color: #ffffff;
               font-size: 22px; font-weight: 700; }
    .body    { padding: 32px; color: #18181b; line-height: 1.6; }
    .cta     { display: inline-block; margin: 24px 0; padding: 14px 28px;
               background: #7c3aed; color: #ffffff; text-decoration: none;
               border-radius: 6px; font-weight: 600; font-size: 16px; }
    .footer  { padding: 16px 32px; font-size: 12px; color: #71717a;
               border-top: 1px solid #e4e4e7; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">Team Invitation</div>
    <div class="body">
      <p>Hi there,</p>
      <p>
        <strong>${inviterName}</strong> has invited you to join the
        <strong>${teamName}</strong> team.
      </p>
      <p>Click the button below to accept your invitation. This link expires in 7 days.</p>
      <a class="cta" href="${acceptUrl}">Accept Invitation</a>
      <p style="font-size:13px; color:#71717a;">
        Or copy and paste this URL into your browser:<br />
        <span style="word-break:break-all;">${acceptUrl}</span>
      </p>
    </div>
    <div class="footer">
      This invitation was sent to ${recipientEmail}. If you were not expecting this,
      you can safely ignore this email.
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Stub — replace with your actual email provider SDK call
// ---------------------------------------------------------------------------

async function sendTransactionalEmail(_params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // e.g. await resend.emails.send({ from: "noreply@example.com", ...params });
  throw new Error("sendTransactionalEmail: not implemented — wire up your email provider here");
}
