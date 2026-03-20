"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma/client";
import {
  actionSuccess,
  actionFailure,
  withAction,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  RegisterSchema,
  ResetPasswordRequestSchema,
  ResetPasswordSchema,
  type RegisterInput,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
} from "../schema/auth-schema";
import { sendPasswordResetEmail } from "@/lib/email";

export async function registerUser(
  data: RegisterInput
): Promise<ActionResult<{ id: string; email: string }>> {
  return withAction(async () => {
    const parsed = RegisterSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid registration data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return actionFailure("EMAIL_TAKEN", "An account with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
      select: { id: true, email: true },
    });

    return actionSuccess({ id: user.id, email: user.email });
  });
}

export async function requestPasswordReset(
  data: ResetPasswordRequestInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const parsed = ResetPasswordRequestSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid email address.");
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      // Delete any existing unused tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email, usedAt: null },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { email, token, expiresAt },
      });

      try {
        await sendPasswordResetEmail(email, token);
      } catch (error) {
        console.error("[Password Reset Email Error]", error);
        // Don't fail the action if email fails - token is still created
      }
    }

    return actionSuccess({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  });
}

export async function resetPassword(
  data: ResetPasswordInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const parsed = ResetPasswordSchema.safeParse(data);
    if (!parsed.success) {
      return actionFailure("VALIDATION_ERROR", "Invalid reset data.", {
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return actionFailure("INVALID_TOKEN", "This reset link is invalid or has expired.");
    }

    if (resetToken.usedAt) {
      return actionFailure("TOKEN_USED", "This reset link has already been used.");
    }

    if (resetToken.expiresAt < new Date()) {
      return actionFailure("TOKEN_EXPIRED", "This reset link has expired. Please request a new one.");
    }

    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: { id: true },
    });

    if (!user) {
      return actionFailure("USER_NOT_FOUND", "No account found for this email.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return actionSuccess({ message: "Your password has been reset successfully." });
  });
}
