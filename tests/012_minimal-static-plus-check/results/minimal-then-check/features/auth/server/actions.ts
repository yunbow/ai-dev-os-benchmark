"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import {
  ActionResult,
  ActionErrors,
  createSuccess,
  createFailure,
} from "@/lib/actions/types";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/schema";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-forwarded-for") ?? "unknown";
}

export async function registerUser(
  input: unknown
): Promise<ActionResult<{ userId: string }>> {
  const ip = await getClientIp();
  const { success: rateLimitOk } = checkRateLimit(`auth:register:${ip}`, RateLimits.auth);
  if (!rateLimitOk) return ActionErrors.rateLimited();

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return createFailure(parsed.error.issues[0].message, "VALIDATION_ERROR");
  }

  const { email, password, name } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return createFailure("Email already registered", "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    return createSuccess({ userId: user.id });
  } catch {
    return ActionErrors.internal();
  }
}

export async function requestPasswordReset(
  input: unknown
): Promise<ActionResult<void>> {
  const ip = await getClientIp();
  const { success: rateLimitOk } = checkRateLimit(`auth:reset:${ip}`, RateLimits.auth);
  if (!rateLimitOk) return ActionErrors.rateLimited();

  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return createFailure(parsed.error.issues[0].message, "VALIDATION_ERROR");
  }

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) return createSuccess(undefined);

    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    // Fire-and-forget: don't block on email send, fail-safe
    sendPasswordResetEmail(email, resetUrl).catch(() => undefined);

    return createSuccess(undefined);
  } catch {
    return ActionErrors.internal();
  }
}

export async function resetPassword(input: unknown): Promise<ActionResult<void>> {
  const ip = await getClientIp();
  const { success: rateLimitOk } = checkRateLimit(`auth:resetpw:${ip}`, RateLimits.auth);
  if (!rateLimitOk) return ActionErrors.rateLimited();

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return createFailure(parsed.error.issues[0].message, "VALIDATION_ERROR");
  }

  const { token, password } = parsed.data;

  try {
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return createFailure("Invalid or expired reset token", "INVALID_TOKEN");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return createSuccess(undefined);
  } catch {
    return ActionErrors.internal();
  }
}
