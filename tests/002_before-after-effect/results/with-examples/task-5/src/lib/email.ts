// src/lib/email.ts
import nodemailer from "nodemailer";

// Escape user-originated values before embedding in HTML to prevent HTML injection
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  // resetUrl contains a cryptographically random token — still encode for safety
  const safeResetUrl = encodeURI(resetUrl);

  // email is a validated address (Zod checked upstream); no free-text, no escaping needed
  // safeResetUrl is system-generated — escaping not required, but encodeURI applied above

  await transporter.sendMail({
    from: `"TaskFlow Security" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: "Reset your TaskFlow password",
    html: `
      <p>You requested a password reset for your TaskFlow account.</p>
      <p>Click the link below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${safeResetUrl}">Reset my password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr />
      <p style="color:#888;font-size:12px;">
        Do not share this link. It is single-use and expires in 1 hour.
      </p>
    `,
    text: `Reset your TaskFlow password:\n\n${safeResetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
  });
}
