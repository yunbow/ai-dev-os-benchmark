import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiTooManyRequests,
  apiValidationError,
  apiInternalError,
} from "@/lib/api/response";
import { TeamSchema } from "@/features/teams/schema/team-schema";
import { createTeam, getTeams } from "@/features/teams/server/team-actions";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiUnauthorized();

    const rl = checkRateLimit(session.user.id, "read");
    if (!rl.allowed) return apiTooManyRequests(rl.resetAt);

    const result = await getTeams();

    if (!result.success) {
      return apiInternalError();
    }

    return apiSuccess(result.data, { headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
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

    const parsed = TeamSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const result = await createTeam(parsed.data);

    if (!result.success) {
      if (result.error.code === "FORBIDDEN") return apiForbidden();
      return apiInternalError();
    }

    return apiSuccess(result.data, { status: 201, headers: getRateLimitHeaders(rl) });
  } catch {
    return apiInternalError();
  }
}
