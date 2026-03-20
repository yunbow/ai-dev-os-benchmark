"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from "@/lib/validations";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; details?: Record<string, string[]> };

export async function register(formData: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return {
      success: false,
      error: "Validation failed",
      details,
    };
  }

  const { name, email, password } = parsed.data;

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return { success: true, data: { email: user.email } };
}

export async function resetPasswordRequest(
  email: string
): Promise<ActionResult> {
  const parsed = passwordResetRequestSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: "Invalid email address." };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Always return success to prevent user enumeration
  if (!user) {
    return {
      success: true,
      data: undefined,
    };
  }

  // Invalidate any existing tokens
  await db.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  try {
    await sendPasswordResetEmail(
      user.email,
      token,
      user.name ?? user.email
    );
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    // Don't expose email sending failures
  }

  return { success: true };
}

export async function resetPassword(
  token: string,
  password: string
): Promise<ActionResult> {
  const parsed = passwordResetSchema.safeParse({ token, password });
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    });
    return { success: false, error: "Validation failed", details };
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });

  if (!resetToken) {
    return { success: false, error: "Invalid or expired reset token." };
  }

  if (resetToken.usedAt) {
    return { success: false, error: "This reset token has already been used." };
  }

  if (resetToken.expiresAt < new Date()) {
    return { success: false, error: "This reset token has expired." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}
