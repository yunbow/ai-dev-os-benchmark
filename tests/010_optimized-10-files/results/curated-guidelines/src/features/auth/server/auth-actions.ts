"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signIn } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { withAction, ActionErrors, createActionSuccess, type ActionResult } from "@/lib/actions/action-helpers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  RegisterSchema,
  LoginSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  type RegisterInput,
  type LoginInput,
  type RequestPasswordResetInput,
  type ResetPasswordInput,
} from "../schema/auth-schema";
import { headers } from "next/headers";

function getClientIp(): Promise<string> {
  return headers().then((h) => h.get("x-forwarded-for") ?? "unknown");
}

export async function registerUser(data: RegisterInput): Promise<ActionResult<{ userId: string }>> {
  return withAction(
    async ({ validData }) => {
      const ip = await getClientIp();
      const { success: rateLimitOk } = await checkRateLimit(`auth:register:${ip}`, RATE_LIMITS.auth);
      if (!rateLimitOk) return ActionErrors.rateLimit();

      const existing = await prisma.user.findUnique({ where: { email: validData.email } });
      if (existing) {
        return ActionErrors.conflict("An account with this email already exists");
      }

      const passwordHash = await bcrypt.hash(validData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: validData.email,
          name: validData.name,
          passwordHash,
        },
      });

      return createActionSuccess({ userId: user.id });
    },
    { data, schema: RegisterSchema }
  );
}

export async function loginUser(data: LoginInput): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const ip = await getClientIp();
      const { success: rateLimitOk } = await checkRateLimit(`auth:login:${ip}`, RATE_LIMITS.auth);
      if (!rateLimitOk) return ActionErrors.rateLimit();

      try {
        await signIn("credentials", {
          email: validData.email,
          password: validData.password,
          redirect: false,
        });
        return createActionSuccess(undefined);
      } catch {
        return ActionErrors.unauthorized("Invalid email or password");
      }
    },
    { data, schema: LoginSchema }
  );
}

export async function requestPasswordReset(
  data: RequestPasswordResetInput
): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const ip = await getClientIp();
      const { success: rateLimitOk } = await checkRateLimit(`auth:reset:${ip}`, RATE_LIMITS.auth);
      if (!rateLimitOk) return ActionErrors.rateLimit();

      const user = await prisma.user.findUnique({ where: { email: validData.email } });

      // Always return success to prevent email enumeration
      if (!user) return createActionSuccess(undefined);

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

      const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send email asynchronously (don't block response)
      sendPasswordResetEmail({
        to: user.email,
        resetLink,
        userName: user.name ?? undefined,
      }).catch((err) => console.error("Failed to send password reset email:", err));

      return createActionSuccess(undefined);
    },
    { data, schema: RequestPasswordResetSchema }
  );
}

export async function resetPassword(data: ResetPasswordInput): Promise<ActionResult<void>> {
  return withAction(
    async ({ validData }) => {
      const ip = await getClientIp();
      const { success: rateLimitOk } = await checkRateLimit(`auth:reset-confirm:${ip}`, RATE_LIMITS.auth);
      if (!rateLimitOk) return ActionErrors.rateLimit();

      const resetRecord = await prisma.passwordReset.findUnique({
        where: { token: validData.token },
        include: { user: true },
      });

      if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
        return ActionErrors.validation({ token: ["Invalid or expired reset token"] });
      }

      const passwordHash = await bcrypt.hash(validData.password, 12);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetRecord.userId },
          data: { passwordHash },
        }),
        prisma.passwordReset.update({
          where: { id: resetRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);

      return createActionSuccess(undefined);
    },
    { data, schema: ResetPasswordSchema }
  );
}
