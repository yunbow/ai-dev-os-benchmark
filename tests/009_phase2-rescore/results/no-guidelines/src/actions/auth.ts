"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { actionSuccess, actionError } from "@/lib/api-response";
import { sendPasswordResetEmail } from "@/lib/email";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerAction(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return actionError("Validation failed", { email: ["Email is already in use"] });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: { name, email, passwordHash },
  });

  return actionSuccess(undefined);
}

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return actionSuccess(undefined);
  } catch (error) {
    if (error instanceof AuthError) {
      return actionError("Invalid email or password");
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
  return actionSuccess(undefined);
}

export async function forgotPasswordAction(formData: FormData) {
  const raw = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return actionSuccess(undefined);

  // Invalidate old tokens
  await db.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const reset = await db.passwordReset.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetEmail(email, reset.token);

  return actionSuccess(undefined);
}

export async function resetPasswordAction(formData: FormData) {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return actionError("Validation failed", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { token, password } = parsed.data;

  const reset = await db.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return actionError("This reset link is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    }),
    db.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return actionSuccess(undefined);
}
