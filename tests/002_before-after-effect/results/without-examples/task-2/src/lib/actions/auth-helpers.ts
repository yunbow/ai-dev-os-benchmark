// src/lib/actions/auth-helpers.ts
// Minimal stub — replace with your actual NextAuth.js / session implementation.

import { auth } from "@/auth";

export type AuthSuccess = {
  success: true;
  user: { id: string; email: string; name?: string | null };
};
export type AuthFailure = { success: false };
export type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false };
  }

  return {
    success: true,
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name,
    },
  };
}
