"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { withAction, ActionErrors, createSuccess, ActionResult } from "@/lib/actions/action-helpers";
import {
  registerSchema,
  RegisterInput,
  passwordResetRequestSchema,
  passwordResetSchema,
  PasswordResetRequestInput,
  PasswordResetInput,
} from "@/features/auth/schema/auth-schema";

export async function registerUser(input: RegisterInput): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return ActionErrors.conflict("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
      },
    });

    return createSuccess({ id: user.id });
  });
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput
): Promise<ActionResult<void>> {
  return withAction(async () => {
    const parsed = passwordResetRequestSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    // Always return success to prevent email enumeration
    if (!user) return createSuccess(undefined);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // In production: send email with reset link
    console.log(`Password reset link: /reset-password?token=${token}`);

    return createSuccess(undefined);
  });
}

export async function resetPassword(input: PasswordResetInput): Promise<ActionResult<void>> {
  return withAction(async () => {
    const parsed = passwordResetSchema.safeParse(input);
    if (!parsed.success) {
      return ActionErrors.validation(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: parsed.data.token },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired reset token" },
      };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return createSuccess(undefined);
  });
}
