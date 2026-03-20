"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/require-auth";
import { signIn, signOut } from "@/lib/auth/auth";
import { withAction, ActionResult, ActionErrors } from "@/lib/actions/action-helpers";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../schema/auth-schema";
import { sendPasswordResetEmail } from "@/lib/email/email";

export async function registerAction(data: RegisterInput): Promise<ActionResult<{ id: string }>> {
  return withAction(
    async ({ validData }) => {
      const existing = await prisma.user.findUnique({ where: { email: validData!.email } });
      if (existing) {
        return ActionErrors.conflict("An account with this email already exists");
      }

      const hashedPassword = await bcrypt.hash(validData!.password, 12);

      const user = await prisma.user.create({
        data: {
          name: validData!.name,
          email: validData!.email,
          password: hashedPassword,
        },
      });

      return { success: true, data: { id: user.id } };
    },
    { data, schema: registerSchema }
  );
}

export async function loginAction(
  email: string,
  password: string,
  callbackUrl?: string
): Promise<ActionResult<void>> {
  return withAction(async () => {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl ?? "/dashboard",
    });
    return { success: true, data: undefined };
  });
}

export async function logoutAction(): Promise<ActionResult<void>> {
  return withAction(async () => {
    await signOut({ redirectTo: "/login" });
    return { success: true, data: undefined };
  });
}

export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const user = await prisma.user.findUnique({ where: { email: validData!.email } });

      // Always return success to prevent email enumeration
      if (!user) return { success: true, data: undefined };

      // Invalidate existing tokens
      await prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordReset.create({
        data: { token, userId: user.id, expiresAt },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);

      return { success: true, data: undefined };
    },
    { data, schema: forgotPasswordSchema }
  );
}

export async function resetPasswordAction(
  data: ResetPasswordInput
): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const reset = await prisma.passwordReset.findUnique({
        where: { token: validData!.token },
      });

      if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
        return { success: false, error: { code: "INVALID_TOKEN", message: "This link is invalid or has expired" } };
      }

      const hashedPassword = await bcrypt.hash(validData!.password, 12);

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

      return { success: true, data: undefined };
    },
    { data, schema: resetPasswordSchema }
  );
}

export async function getCurrentUser() {
  const authResult = await requireAuth();
  if (!authResult.success) return null;

  return prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });
}
