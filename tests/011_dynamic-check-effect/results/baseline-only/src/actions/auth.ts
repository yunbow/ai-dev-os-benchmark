"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { generateToken } from "@/lib/utils";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/types";
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email";
import { AuthError } from "next-auth";

export async function registerAction(data: RegisterInput): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await bcryptjs.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    },
    select: { id: true },
  });

  return { success: true, data: { id: user.id } };
}

export async function loginAction(
  data: LoginInput & { callbackUrl?: string }
): Promise<ActionResult<void>> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          return { success: false, error: "Authentication failed. Please try again." };
      }
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}

export async function forgotPasswordAction(
  data: ForgotPasswordInput
): Promise<ActionResult<void>> {
  const parsed = forgotPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true, data: undefined };
  }

  // Invalidate existing tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = generateToken(48);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your TaskFlow password",
      html: getPasswordResetEmailHtml(resetUrl, user.name ?? user.email),
    });
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    // Don't reveal email sending failures to the user
  }

  return { success: true, data: undefined };
}

export async function resetPasswordAction(
  data: ResetPasswordInput
): Promise<ActionResult<void>> {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true } } },
  });

  if (!resetToken) {
    return { success: false, error: "Invalid or expired reset token" };
  }

  if (resetToken.used) {
    return { success: false, error: "This reset link has already been used" };
  }

  if (resetToken.expiresAt < new Date()) {
    return { success: false, error: "This reset link has expired. Please request a new one." };
  }

  const hashedPassword = await bcryptjs.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { success: true, data: undefined };
}
