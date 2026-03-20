import { NextRequest } from "next/server";
import { withAuth, apiError, apiSuccess, handleZodError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { CreateTeamSchema } from "@/lib/validations/team";
import * as teamService from "@/lib/services/team.service";
import type { AuthenticatedSession } from "@/lib/api-helpers";

export const GET = withAuth(async (req: NextRequest, session: AuthenticatedSession) => {
  const rl = checkRateLimit(session.user.id, "read");
  if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

  const teams = await teamService.getTeams(session.user.id);
  return apiSuccess(teams);
});

export const POST = withAuth(async (req: NextRequest, session: AuthenticatedSession) => {
  const rl = checkRateLimit(session.user.id, "write");
  if (!rl.allowed) return apiError(429, "RATE_LIMITED", "Too many requests");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) return handleZodError(parsed.error);

  const team = await teamService.createTeam(parsed.data, session.user.id);
  return apiSuccess(team, 201);
});
