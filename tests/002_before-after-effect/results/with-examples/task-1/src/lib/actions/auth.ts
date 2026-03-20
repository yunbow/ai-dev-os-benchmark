"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitPresets } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import { ActionResult, createActionSuccess, createActionError } from "@/types";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

export async function registerUser(
  formData: FormData,
): Promise<ActionResult> {
  // Rate limiting: 5 attempts per minute per IP
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(`auth:register:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createActionError("Too many registration attempts. Please try again later.");
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return createActionError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return createActionError("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  redirect("/login?registered=1");
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<ActionResult> {
  // Rate limiting: 5 attempts per minute per IP
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(`auth:reset:${ip}`, {
    maxRequests: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.success) {
    return createActionError("Too many requests. Please try again later.");
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return createActionError("Invalid email address");
  }

  const { email } = parsed.data;

  // Always return success to avoid email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return createActionSuccess();
  }

  // Invalidate existing tokens
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Generate cryptographically secure token (256-bit)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;
  await sendPasswordResetEmail(email, resetUrl);

  return createActionSuccess();
}

export async function resetPassword(
  formData: FormData,
): Promise<ActionResult> {
  // Rate limiting: strict 5 attempts per minute per IP
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(
    `auth:reset-password:${ip}`,
    RateLimitPresets.strict,
  );
  if (!rateLimit.success) {
    return createActionError("Too many attempts. Please try again later.");
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return createActionError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { token, password } = parsed.data;

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    return createActionError("Invalid or expired reset link");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword, failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.passwordReset.update({
      where: { token },
      data: { used: true },
    }),
  ]);

  redirect("/login?reset=1");
}
