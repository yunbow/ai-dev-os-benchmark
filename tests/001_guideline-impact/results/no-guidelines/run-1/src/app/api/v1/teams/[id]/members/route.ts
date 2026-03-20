import { NextRequest } from "next/server";
import { withAuth, apiError, apiSuccess, handleZodError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { InviteMemberSchema } from "@/lib/validations/team";
import * as teamService from "@/lib/services/team.service";
import { db } from "@/lib/db";
import type { AuthenticatedSession } from "@/lib/api-helpers";

export const GET = withAuth(
  async (req: NextRequest, session: AuthenticatedSession, params) => {
    const rl = checkRateLimit(session.user.id, "read");
    if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

    try {
      const team = await teamService.getTeamById(params!.id, session.user.id);
      return apiSuccess(team.members);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Team not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);

export const POST = withAuth(
  async (req: NextRequest, session: AuthenticatedSession, params) => {
    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
    }

    const parsed = InviteMemberSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    try {
      await teamService.inviteMember(params!.id, parsed.data, session.user.id);
      return apiSuccess({ message: "Invitation sent" }, 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      if (message === "NOT_FOUND") return apiError(404, "NOT_FOUND", "Team not found");
      if (message === "FORBIDDEN") return apiError(403, "FORBIDDEN", "Access denied");
      if (message === "ALREADY_MEMBER") return apiError(409, "ALREADY_MEMBER", "User is already a team member");
      return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred");
    }
  }
);
