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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPasswordResetEmail(
  toEmail: string,
  rawToken: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set");

  // Build the reset URL with the raw (unhashed) token
  const resetUrl = new URL("/auth/reset-password", appUrl);
  resetUrl.searchParams.set("token", rawToken);

  // Escape the URL before embedding in HTML to prevent injection
  const safeResetUrl = escapeHtml(resetUrl.toString());

  await transporter.sendMail({
    from: `"${escapeHtml(process.env.EMAIL_FROM_NAME ?? "Support")}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: toEmail,
    subject: "Reset your password",
    text: `You requested a password reset. Open this link within 1 hour:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="font-family:sans-serif;color:#111;max-width:480px;margin:0 auto;padding:24px">
  <h2>Reset your password</h2>
  <p>We received a request to reset the password for your account.</p>
  <p>
    <a href="${safeResetUrl}"
       style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
      Reset password
    </a>
  </p>
  <p style="font-size:13px;color:#555">
    This link expires in <strong>1 hour</strong>.<br />
    If you did not request a password reset, you can safely ignore this email.
  </p>
</body>
</html>`,
  });
}
