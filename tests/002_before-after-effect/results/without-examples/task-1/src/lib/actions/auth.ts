"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ActionErrors } from "@/lib/errors";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import type { ActionResult } from "@/lib/types";

export async function register(
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const { email, password, name } = parsed.data;

  // Check if email is already taken
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return {
      success: false,
      error: ActionErrors.EMAIL_TAKEN,
    };
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash,
    },
  });

  return {
    success: true,
    data: { email },
  };
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<ActionResult<{ sent: boolean }>> {
  const raw = { email: formData.get("email") };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create new single-use token with 1-hour expiry
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name ?? user.email,
        token,
      });
    } catch {
      // Don't expose email sending failures
      console.error("Failed to send password reset email");
    }
  }

  // Always return success (don't reveal if email exists)
  return {
    success: true,
    data: { sent: true },
  };
}

export async function resetPassword(
  formData: FormData,
): Promise<ActionResult<{ reset: boolean }>> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        ...ActionErrors.VALIDATION_ERROR,
        details: parsed.error.issues,
      },
    };
  }

  const { token, password } = parsed.data;

  // Find the token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!resetToken) {
    return {
      success: false,
      error: ActionErrors.INVALID_TOKEN,
    };
  }

  if (resetToken.usedAt) {
    return {
      success: false,
      error: ActionErrors.TOKEN_USED,
    };
  }

  if (resetToken.expiresAt < new Date()) {
    return {
      success: false,
      error: ActionErrors.TOKEN_EXPIRED,
    };
  }

  // Mark token as used and update password atomically
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    // Invalidate all existing sessions for security
    prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  return {
    success: true,
    data: { reset: true },
  };
}
