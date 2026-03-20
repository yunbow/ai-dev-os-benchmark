"use server";

import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { rateLimit } from "@/lib/rate-limit";

const RequestSchema = z.object({
  email: z.string().email(),
});

export type RequestPasswordResetResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: initiates a password reset.
 *
 * Security notes:
 * - Rate limited (auth preset: 10/min per IP).
 * - Always returns success to prevent user-enumeration attacks.
 * - The raw token is sent in the email only; the DB stores its SHA-256 hash.
 * - Any previous unused tokens for the same user are invalidated before
 *   creating a new one, limiting the window for token-fixation attacks.
 */
export async function requestPasswordReset(
  formData: FormData
): Promise<RequestPasswordResetResult> {
  // Rate limiting — auth preset
  const limited = await rateLimit("auth", formData.get("_ip") as string | null);
  if (!limited.success) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  // Input validation
  const parsed = RequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: "Invalid email address." };
  }
  const { email } = parsed.data;

  // Look up the user — do NOT reveal whether the email exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate a cryptographically secure random token (32 bytes → 64-char hex)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    // Fire-and-forget email send — do not block or expose errors to the caller
    sendPasswordResetEmail(email, rawToken).catch((err) => {
      console.error("[requestPasswordReset] email send failed", err);
    });
  }

  // Always return success regardless of whether the email was found
  return { success: true };
}
