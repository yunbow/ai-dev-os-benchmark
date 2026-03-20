import { auth } from "@/lib/auth/config";
import { ActionErrors, ActionFailure } from "@/lib/actions/types";

export type AuthResult =
  | { success: true; user: { id: string; email: string; name?: string | null } }
  | ActionFailure;

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionErrors.unauthorized();
  }
  return {
    success: true,
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
    },
  };
}
