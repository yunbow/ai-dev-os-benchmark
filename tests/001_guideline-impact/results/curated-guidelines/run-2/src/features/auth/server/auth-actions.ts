"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { withAction, ActionResult, requireAuth } from "@/lib/actions/action-helpers";
import { ActionErrors } from "@/lib/actions/errors";
import {
  RegisterSchema,
  LoginSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  RegisterInput,
  LoginInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
} from "../schema/auth-schema";
import { sendPasswordResetEmail } from "@/lib/email";
import { signIn, signOut } from "@/lib/auth";
import { rateLimit } from "@/lib/api/rate-limit";
import { headers } from "next/headers";

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0] ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

export async function register(
  input: RegisterInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const ip = await getClientIp();
    const rateLimitResult = rateLimit(`register:${ip}`, 5, 60000);
    if (!rateLimitResult.success) {
      return { success: false, error: ActionErrors.rateLimited() };
    }

    const parsed = RegisterSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return {
        success: false,
        error: ActionErrors.conflict("An account with this email already exists."),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return { success: true, data: { message: "Account created successfully." } };
  });
}

export async function login(
  input: LoginInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const ip = await getClientIp();
    const rateLimitResult = rateLimit(`login:${ip}`, 5, 60000);
    if (!rateLimitResult.success) {
      return { success: false, error: ActionErrors.rateLimited() };
    }

    const parsed = LoginSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      return { success: true, data: { message: "Logged in successfully." } };
    } catch {
      return {
        success: false,
        error: ActionErrors.badRequest("Invalid email or password."),
      };
    }
  });
}

export async function logout(): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    await signOut({ redirect: false });
    return { success: true, data: { message: "Logged out successfully." } };
  });
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const ip = await getClientIp();
    const rateLimitResult = rateLimit(`reset-request:${ip}`, 5, 60000);
    if (!rateLimitResult.success) {
      return { success: false, error: ActionErrors.rateLimited() };
    }

    const parsed = RequestPasswordResetSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        success: true,
        data: { message: "If an account exists with this email, a reset link has been sent." },
      };
    }

    // Invalidate existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(email, token);

    return {
      success: true,
      data: { message: "If an account exists with this email, a reset link has been sent." },
    };
  });
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult<{ message: string }>> {
  return withAction(async () => {
    const parsed = ResetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: ActionErrors.badRequest("Invalid or expired reset token.") };
    }

    if (resetToken.usedAt || new Date() > resetToken.expiresAt) {
      return { success: false, error: ActionErrors.badRequest("This reset token has expired or already been used.") };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: {
          password: hashedPassword,
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, data: { message: "Password reset successfully." } };
  });
}
