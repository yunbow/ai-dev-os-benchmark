import { auth } from "./auth";
import { ActionErrors, ActionFailure } from "@/lib/actions/action-helpers";

export interface AuthSuccess {
  success: true;
  userId: string;
}

export type AuthResult = AuthSuccess | ActionFailure;

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return ActionErrors.unauthorized();
  }
  return { success: true, userId: session.user.id };
}
