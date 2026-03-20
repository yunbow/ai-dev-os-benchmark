import { auth } from "@/lib/auth/auth";
import { actionFailure, type ActionFailure } from "./action-helpers";

export interface AuthenticatedSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
}

export type RequireAuthResult =
  | { authenticated: true; session: AuthenticatedSession }
  | { authenticated: false; error: ActionFailure };

export async function requireAuth(): Promise<RequireAuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      authenticated: false,
      error: actionFailure("UNAUTHORIZED", "You must be logged in to perform this action."),
    };
  }

  return {
    authenticated: true,
    session: {
      user: {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name,
        role: session.user.role ?? "USER",
      },
    },
  };
}

export interface OwnershipCheckOptions {
  resourceUserId: string;
  currentUserId: string;
  currentUserRole?: string;
  // If true, admins can bypass the ownership check
  adminBypass?: boolean;
}

export function requireOwnership(options: OwnershipCheckOptions): boolean {
  const { resourceUserId, currentUserId, currentUserRole, adminBypass = false } = options;

  if (adminBypass && currentUserRole === "ADMIN") {
    return true;
  }

  return resourceUserId === currentUserId;
}

export function checkOwnership(options: OwnershipCheckOptions): ActionFailure | null {
  if (!requireOwnership(options)) {
    return actionFailure(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }
  return null;
}
