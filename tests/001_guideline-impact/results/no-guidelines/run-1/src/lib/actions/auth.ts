"use server";

import { RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema } from "@/lib/validations/auth";
import * as authService from "@/lib/services/auth.service";
import type { ActionResult } from "@/types";

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const user = await authService.registerUser(parsed.data);
    return { success: true, data: { userId: user.id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "EMAIL_IN_USE") {
      return { success: false, error: "An account with this email already exists." };
    }
    return { success: false, error: "Registration failed. Please try again." };
  }
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get("email") };
  const parsed = ForgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await authService.requestPasswordReset(parsed.data.email);
  // Always return success to avoid revealing if email exists
  return { success: true };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = ResetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "INVALID_TOKEN") return { success: false, error: "Invalid or expired reset link." };
    if (message === "TOKEN_EXPIRED") return { success: false, error: "This reset link has expired. Please request a new one." };
    return { success: false, error: "Password reset failed. Please try again." };
  }
}
