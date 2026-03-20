"use server";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { signIn } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  ActionErrors,
  createActionSuccess,
  handleActionError,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "../schema/auth-schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { AuthError } from "next-auth";

export async function registerAction(input: RegisterInput): Promise<ActionResult<{ email: string }>> {
  try {
    const validated = RegisterSchema.parse(input);

    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) {
      return {
        success: false,
        error: { code: "CONFLICT", message: "An account with this email already exists" },
      };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
      },
    });

    return createActionSuccess({ email: user.email });
  } catch (error) {
    return handleActionError(error);
  }
}

export async function loginAction(
  email: string,
  password: string,
  callbackUrl?: string
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return createActionSuccess({ redirectUrl: callbackUrl || "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      };
    }
    return handleActionError(error);
  }
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<ActionResult<void>> {
  try {
    const validated = ForgotPasswordSchema.parse(input);

    const user = await prisma.user.findUnique({ where: { email: validated.email } });
    // Always return success to prevent email enumeration
    if (!user) return createActionSuccess(undefined);

    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await sendPasswordResetEmail(user.email, token);

    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}

export async function resetPasswordAction(
  input: ResetPasswordInput
): Promise<ActionResult<void>> {
  try {
    const validated = ResetPasswordSchema.parse(input);

    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: validated.token },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      return {
        success: false,
        error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired" },
      };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return createActionSuccess(undefined);
  } catch (error) {
    return handleActionError(error);
  }
}
