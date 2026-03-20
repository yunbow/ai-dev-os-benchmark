"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-forwarded-for") ?? "unknown";
}

export async function registerUser(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const ip = await getClientIp();
  const rl = rateLimit(`auth:register:${ip}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs);
  if (!rl.success) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "Email is already registered" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: { name, email, passwordHash },
    });
  } catch (err) {
    console.error("registerUser DB error:", err);
    return { success: false, error: "Registration failed. Please try again." };
  }

  return { success: true, data: { email } };
}

export async function requestPasswordReset(
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();
  const rl = rateLimit(`auth:reset-request:${ip}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs);
  if (!rl.success) {
    // Still return success to prevent timing-based enumeration
    return { success: true, data: undefined };
  }

  const raw = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid email address" };
  }

  const { email } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, data: undefined };
    }

    // Invalidate existing tokens
    await db.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    await sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    // Return success anyway to avoid enumeration
  }

  return { success: true, data: undefined };
}

export async function resetPassword(
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();
  const rl = rateLimit(`auth:reset:${ip}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs);
  if (!rl.success) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { token, password } = parsed.data;

  try {
    const reset = await db.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      db.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);
  } catch (err) {
    console.error("resetPassword DB error:", err);
    return { success: false, error: "Password reset failed. Please try again." };
  }

  return { success: true, data: undefined };
}
