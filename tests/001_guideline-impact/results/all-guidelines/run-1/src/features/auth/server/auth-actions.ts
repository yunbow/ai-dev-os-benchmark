"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  withAction,
  createActionSuccess,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "../schema/auth-schema";
import { sendPasswordResetEmail } from "@/lib/email";

export async function registerUser(
  input: RegisterInput
): Promise<ActionResult<{ email: string }>> {
  return withAction(
    async ({ validData }) => {
      const { name, email, password } = validData!;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return {
          success: false,
          error: {
            code: "UNIQUE_CONSTRAINT",
            message: "An account with this email already exists",
            fieldErrors: { email: ["This email is already registered"] },
          },
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });

      return createActionSuccess({ email });
    },
    { data: input, schema: registerSchema }
  );
}

export async function requestPasswordReset(
  input: ForgotPasswordInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(
    async ({ validData }) => {
      const { email } = validData!;

      const user = await prisma.user.findUnique({ where: { email } });

      // Always return success to prevent email enumeration
      if (!user) {
        return createActionSuccess({
          message:
            "If an account exists with this email, a reset link has been sent.",
        });
      }

      // Invalidate existing tokens
      await prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordReset.create({
        data: { userId: user.id, token, expiresAt },
      });

      await sendPasswordResetEmail(email, token);

      return createActionSuccess({
        message:
          "If an account exists with this email, a reset link has been sent.",
      });
    },
    { data: input, schema: forgotPasswordSchema }
  );
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(
    async ({ validData }) => {
      const { token, password } = validData!;

      const reset = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
        return {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "This password reset link is invalid or has expired",
          },
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: reset.userId },
          data: { password: hashedPassword },
        }),
        prisma.passwordReset.update({
          where: { id: reset.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return createActionSuccess({ message: "Password reset successfully" });
    },
    { data: input, schema: resetPasswordSchema }
  );
}
