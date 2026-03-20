"use server";

import { headers } from "next/headers";
import { signIn } from "@/../../auth";
import { LoginSchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { AuthError } from "next-auth";

export type LoginResult =
  | { success: true }
  | { success: false; error: string };

export async function loginUser(formData: FormData): Promise<LoginResult> {
  // ✅ Rate limiting: 10 attempts per minute per IP (auth preset)
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const { success: rateLimitOk } = await checkRateLimit(`auth:login:${ip}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (!rateLimitOk) {
    return { success: false, error: "Too many login attempts. Please try again later." };
  }

  // ✅ Validate input with Zod
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: "Invalid email or password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // Return a generic message — never reveal whether email exists
      return { success: false, error: "Invalid email or password." };
    }
    throw error;
  }
}
