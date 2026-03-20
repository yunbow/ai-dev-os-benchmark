import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiTooManyRequests,
  apiInternalError,
} from "@/lib/api/response";
import { getTeam } from "@/features/teams/server/team-actions";

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
    const result = await getTeam(id);

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
