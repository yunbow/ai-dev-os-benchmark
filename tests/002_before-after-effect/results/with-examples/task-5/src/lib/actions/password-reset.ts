// src/lib/actions/password-reset.ts
"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

// ── Schemas ──────────────────────────────────────────────────────────────────

const RequestResetSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Constants ────────────────────────────────────────────────────────────────

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const BCRYPT_ROUNDS = 12;

// ── Helper ───────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for") ?? "unknown";
}

// ── Server Action: Request password reset ────────────────────────────────────

export async function requestPasswordReset(
  formData: FormData,
): Promise<ActionResult> {
  // Rate limit: 5 attempts per IP per minute (auth preset)
  const ip = await getClientIp();
  const { success: withinLimit } = await checkRateLimit(
    `auth:password-reset-request:${ip}`,
    { maxRequests: 5, windowMs: 60_000 },
  );
  if (!withinLimit) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  // Validate input
  const parsed = RequestResetSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { success: false, error: "Invalid email address." };
  }
  const { email } = parsed.data;

  // Look up user — always return the same generic response to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }, // mark as used so they cannot be redeemed
    });

    // Generate a cryptographically secure single-use token (256-bit)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // Send asynchronously — do not block the response, fail-safe on error
    sendPasswordResetEmail(email, resetUrl).catch((err) => {
      console.error("[requestPasswordReset] Failed to send email:", err);
    });
  }

  // Always return success to prevent email enumeration
  return {
    success: true,
    data: undefined,
  };
}

// ── Server Action: Reset password ────────────────────────────────────────────

export async function resetPassword(
  formData: FormData,
): Promise<ActionResult> {
  // Rate limit: 5 attempts per IP per minute
  const ip = await getClientIp();
  const { success: withinLimit } = await checkRateLimit(
    `auth:password-reset:${ip}`,
    { maxRequests: 5, windowMs: 60_000 },
  );
  if (!withinLimit) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }

  // Validate input
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input.",
    };
  }
  const { token, password } = parsed.data;

  // Look up token
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  // Generic error for invalid / expired / already-used tokens (no information leakage)
  if (
    !resetRecord ||
    resetRecord.usedAt !== null ||          // already redeemed (single-use)
    resetRecord.expiresAt < new Date()      // expired
  ) {
    return {
      success: false,
      error: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  // Hash the new password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Atomically update password and invalidate token in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true, data: undefined };
}
