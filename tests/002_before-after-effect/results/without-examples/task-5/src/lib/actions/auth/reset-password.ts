"use server";

import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const BCRYPT_ROUNDS = 12;

const ResetSchema = z.object({
  token: z.string().min(64).max(64).regex(/^[0-9a-f]+$/),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: consumes a reset token and sets a new password.
 *
 * Security notes:
 * - Rate limited (strict preset: 5/min) to slow brute-force against the token.
 * - Token lookup is done by its SHA-256 hash; the raw value is never stored.
 * - Expiry and single-use (usedAt) are both enforced.
 * - Password and token update are performed in a single transaction to prevent
 *   a race condition where the token is invalidated but the password is not
 *   updated (or vice-versa).
 * - Generic error messages prevent information leakage about token validity.
 */
export async function resetPassword(
  formData: FormData
): Promise<ResetPasswordResult> {
  // Rate limiting — strict preset
  const limited = await rateLimit("strict", formData.get("_ip") as string | null);
  if (!limited.success) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  // Input validation
  const parsed = ResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input.",
    };
  }
  const { token: rawToken, password } = parsed.data;

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  // Use a single generic error for all invalid-token states to avoid leaking
  // information about whether a token ever existed.
  if (!resetToken || resetToken.usedAt !== null || resetToken.expiresAt < new Date()) {
    return { success: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Atomically mark the token as used and update the password
  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
  ]);

  return { success: true };
}
