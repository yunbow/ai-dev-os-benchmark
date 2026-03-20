"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/validations/auth";
import type { ActionResult } from "@/types";

export async function register(formData: FormData): Promise<ActionResult<{ email: string }>> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".") || "root";
      details[key] = [...(details[key] ?? []), e.message];
    });
    return { success: false, error: "Validation failed", details };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return { success: true, data: { email } };
}

export async function forgotPassword(formData: FormData): Promise<ActionResult<void>> {
  const raw = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid email address" };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return { success: true, data: undefined };

  // Invalidate existing tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const token = generateToken(48);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, resetUrl);

  return { success: true, data: undefined };
}

export async function resetPassword(formData: FormData): Promise<ActionResult<void>> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.errors.forEach((e) => {
      const key = e.path.join(".") || "root";
      details[key] = [...(details[key] ?? []), e.message];
    });
    return { success: false, error: "Validation failed", details };
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { success: false, error: "This reset link is invalid or has expired" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

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

  return { success: true, data: undefined };
}
