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
import { inviteTeamMember } from "@/features/teams/server/team-actions";
import { inviteMemberSchema } from "@/features/teams/schema/team-schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError("Validation failed", parsed.error.issues);
  }

  const { id } = await params;
  const result = await inviteTeamMember(id, parsed.data);
  const response = actionResultToResponse(result, 201);
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}
