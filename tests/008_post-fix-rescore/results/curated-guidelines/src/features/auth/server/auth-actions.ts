"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import {
  actionSuccess,
  actionFailure,
  actionInternalError,
  actionValidationError,
  type ActionResult,
} from "@/lib/actions/action-helpers";
import {
  RegisterSchema,
  LoginSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
} from "@/features/auth/schema/auth-schema";
import {
  sendPasswordResetEmail,
} from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AuthError } from "next-auth";

export async function registerUser(
  rawInput: unknown
): Promise<ActionResult<{ userId: string }>> {
  const parsed = RegisterSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  const { email, password, name } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return actionFailure({
        code: "EMAIL_TAKEN",
        message: "An account with this email already exists",
        fieldErrors: { email: ["This email is already registered"] },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, name: name ?? null },
      select: { id: true },
    });

    return actionSuccess({ userId: user.id });
  } catch {
    return actionInternalError();
  }
}

export async function loginUser(
  rawInput: unknown
): Promise<ActionResult<void>> {
  const parsed = LoginSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof AuthError) {
      return actionFailure({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }
    return actionInternalError();
  }
}

export async function logoutUser(): Promise<ActionResult<void>> {
  try {
    await signOut({ redirect: false });
    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}

export async function requestPasswordReset(
  rawInput: unknown
): Promise<ActionResult<void>> {
  const parsed = RequestPasswordResetSchema.safeParse(rawInput);
  if (!parsed.success) {
    return actionValidationError("Invalid email address");
  }

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return actionSuccess(undefined);
    }

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, user.name, token);

    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}

export async function resetPassword(
  rawInput: unknown
): Promise<ActionResult<void>> {
  const parsed = ResetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });
    return actionValidationError("Invalid input", fieldErrors);
  }

  const { token, password } = parsed.data;

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true } } },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return actionFailure({
        code: "INVALID_TOKEN",
        message: "This password reset link is invalid or has expired",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return actionSuccess(undefined);
  } catch {
    return actionInternalError();
  }
}
