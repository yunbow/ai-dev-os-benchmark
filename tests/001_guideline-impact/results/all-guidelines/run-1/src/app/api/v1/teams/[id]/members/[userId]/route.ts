import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  setRateLimitHeaders,
} from "@/lib/api/rate-limit";
import {
  apiUnauthorized,
  apiRateLimited,
  actionResultToResponse,
  apiValidationError,
} from "@/lib/api/response";
import {
  removeTeamMember,
  updateMemberRole,
} from "@/features/teams/server/team-actions";
import { updateMemberRoleSchema } from "@/features/teams/schema/team-schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:teams:write`, "write");
  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError("Validation failed", parsed.error.issues);
  }

  const { id, userId } = await params;
  const result = await updateMemberRole(id, userId, parsed.data);
  const response = actionResultToResponse(result);
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:teams:write`, "write");
  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  const { id, userId } = await params;
  const result = await removeTeamMember(id, userId);

  if (!result.success) {
    return actionResultToResponse(result);
  }

  return new Response(null, { status: 204 });
}
