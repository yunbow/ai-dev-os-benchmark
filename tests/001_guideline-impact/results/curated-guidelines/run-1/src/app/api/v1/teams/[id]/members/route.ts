import { NextRequest } from "next/server";
import { requireApiAuth, apiSuccess, apiError, parseBody, handleApiError } from "@/lib/api/api-helpers";
import {
  listTeamMembersAction,
  inviteTeamMemberAction,
} from "@/features/teams/server/team-actions";
import { inviteMemberSchema } from "@/features/teams/schema/team-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const { id } = await params;
    const result = await listTeamMembersAction(id);
    if (!result.success) {
      const status = result.error.code === "NOT_FOUND" ? 404 : 403;
      return apiError(result.error.code, result.error.message, status);
    }

    return apiSuccess(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { data, response: parseError } = parseBody(inviteMemberSchema, body);
    if (!data) return parseError!;

    const result = await inviteTeamMemberAction(id, data);
    if (!result.success) {
      const status =
        result.error.code === "FORBIDDEN" ? 403 :
        result.error.code === "CONFLICT" ? 409 : 400;
      return apiError(result.error.code, result.error.message, status);
    }

    return apiSuccess({ message: "Invitation sent" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
