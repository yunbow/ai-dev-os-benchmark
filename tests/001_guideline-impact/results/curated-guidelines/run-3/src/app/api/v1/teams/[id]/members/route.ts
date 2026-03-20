import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiTooManyRequests,
  apiValidationError,
  apiInternalError,
} from "@/lib/api/response";
import { InviteSchema } from "@/features/teams/schema/team-schema";
import {
  getTeamMembers,
  inviteMember,
} from "@/features/teams/server/team-actions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rl = checkRateLimit(session.user.id, "read");
    if (!rl.allowed) return apiTooManyRequests(rl.resetAt);

    const { id } = await params;
    const result = await getTeamMembers(id);

    if (!result.success) {
      if (result.error.code === "NOT_FOUND") return apiNotFound();
      if (result.error.code === "FORBIDDEN") return apiForbidden();
      return apiInternalError();
    }

    return apiSuccess(result.data, { headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rl = checkRateLimit(session.user.id, "write");
    if (!rl.allowed) return apiTooManyRequests(rl.resetAt);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiValidationError({ body: ["Invalid JSON"] });
    }

    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { id } = await params;
    const result = await inviteMember(id, parsed.data);

    if (!result.success) {
      if (result.error.code === "FORBIDDEN") return apiForbidden();
      if (result.error.code === "NOT_FOUND") return apiNotFound();
      return apiInternalError();
    }

    return apiSuccess(result.data, { headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}
