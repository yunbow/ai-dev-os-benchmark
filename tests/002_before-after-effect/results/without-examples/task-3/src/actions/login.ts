"use server";

import { signIn } from "@/auth";
import { loginSchema } from "@/lib/schemas/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export type LoginState =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  // Validate input server-side before touching NextAuth
  const parsed = loginSchema.safeParse({
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
  } catch (err) {
    if (err instanceof AuthError) {
      // Never leak the specific reason (prevents user enumeration)
      return { success: false, error: "Invalid email or password." };
    }
    // Unexpected error — do not expose details (section 3.7)
    return { success: false, error: "An unexpected error occurred." };
  }

  // Redirect outside of try/catch: Next.js redirect() throws internally
  redirect("/dashboard");
}
