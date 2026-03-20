import { NextRequest } from "next/server";
import { requireApiAuth, apiSuccess, apiError, parseBody, handleApiError } from "@/lib/api/api-helpers";
import { createTeamAction, listTeamsAction } from "@/features/teams/server/team-actions";
import { createTeamSchema } from "@/features/teams/schema/team-schema";

export async function GET(_request: NextRequest) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const result = await listTeamsAction();
    if (!result.success) {
      return apiError(result.error.code, result.error.message, 400);
    }

    return apiSuccess(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const body = await request.json().catch(() => null);
    const { data, response: parseError } = parseBody(createTeamSchema, body);
    if (!data) return parseError!;

    const result = await createTeamAction(data);
    if (!result.success) {
      return apiError(result.error.code, result.error.message, 400);
    }

    return apiSuccess(result.data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
