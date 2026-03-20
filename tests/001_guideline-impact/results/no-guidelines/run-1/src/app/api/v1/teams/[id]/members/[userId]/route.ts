import { NextRequest } from "next/server";
import { withAuth, apiError, apiSuccess, handleZodError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { UpdateMemberRoleSchema } from "@/lib/validations/team";
import * as teamService from "@/lib/services/team.service";
import type { AuthenticatedSession } from "@/lib/api-helpers";

export const PATCH = withAuth(
  async (req: NextRequest, session: AuthenticatedSession, params) => {
    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
    }

    const parsed = UpdateMemberRoleSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    try {
      await teamService.updateMemberRole(params!.id, params!.userId, parsed.data, session.user.id);
      return apiSuccess({ message: "Role updated" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Member not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      if (message === "CANNOT_CHANGE_OWNER") return apiError(400, "CANNOT_CHANGE_OWNER", "Cannot change owner role");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);

export const DELETE = withAuth(
  async (req: NextRequest, session: AuthenticatedSession, params) => {
    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

    try {
      await teamService.removeMember(params!.id, params!.userId, session.user.id);
      return new Response(null, { status: 204 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Member not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      if (message === "CANNOT_REMOVE_OWNER") return apiError(400, "CANNOT_REMOVE_OWNER", "Cannot remove the team owner");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);
