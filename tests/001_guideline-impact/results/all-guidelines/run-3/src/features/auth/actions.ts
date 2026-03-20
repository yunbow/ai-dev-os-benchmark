"use server";

import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { withAction, actionSuccess, ActionErrors, actionError } from "@/lib/action-helpers";
import { RegisterSchema, RequestPasswordResetSchema, ResetPasswordSchema } from "./schemas";
import { sendPasswordResetEmail } from "@/lib/email";
import type { RegisterInput, RequestPasswordResetInput, ResetPasswordInput } from "./schemas";
import type { ActionResult } from "@/lib/action-helpers";

export async function registerUser(input: RegisterInput): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const validated = RegisterSchema.parse(input);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return actionError("AUTH_EMAIL_EXISTS", "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        passwordHash,
      },
    });

    return actionSuccess({ id: user.id });
  });
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<ActionResult<void>> {
  return withAction(async () => {
    const validated = RequestPasswordResetSchema.parse(input);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return actionSuccess(undefined);
    }

    // Invalidate any existing tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate a raw token (UUID-like), store only its hash
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(user.email, rawToken, appUrl);

    return actionSuccess(undefined);
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult<void>> {
  return withAction(async () => {
    const validated = ResetPasswordSchema.parse(input);

    const tokenHash = createHash("sha256").update(validated.token).digest("hex");

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      return actionError("AUTH_INVALID_TOKEN", "Invalid or expired reset token");
    }

    if (resetToken.usedAt) {
      return actionError("AUTH_TOKEN_USED", "This reset link has already been used");
    }

    if (resetToken.expiresAt < new Date()) {
      return actionError("AUTH_TOKEN_EXPIRED", "This reset link has expired");
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return actionSuccess(undefined);
  });
}
