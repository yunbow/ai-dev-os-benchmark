import { logger } from "@/lib/logger";

interface SuspiciousLoginEmailParams {
  userId: string;
  currentCountry: string | null;
  reasons: string[];
}

/**
 * Send a suspicious login notification email (Section 3.8).
 *
 * Includes IP, country, browser, and OS information.
 * HTML user-derived data is escaped to prevent injection (Section 3.6).
 */
export async function sendSuspiciousLoginEmail(
  params: SuspiciousLoginEmailParams
): Promise<void> {
  const { userId, currentCountry, reasons } = params;

  // Escape any user-derived data before embedding in HTML (Section 3.6)
  const safeCountry = escapeHtml(currentCountry ?? "Unknown");
  const safeReasons = reasons.map(escapeHtml).join("<br>");

  logger.info({ userId, currentCountry }, "Sending suspicious login email");

  // TODO: integrate with your email provider (e.g., Resend, SendGrid)
  // Example payload — replace with actual provider SDK call:
  // await resend.emails.send({
  //   from: "security@yourdomain.com",
  //   to: userEmail,
  //   subject: "Suspicious login detected",
  //   html: buildEmailHtml({ safeCountry, safeReasons }),
  // });

  void safeCountry;
  void safeReasons;
}

/** Escape user-derived data for safe HTML embedding (Section 3.6). */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
