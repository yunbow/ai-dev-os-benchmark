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
  createCategory,
  listCategories,
} from "@/features/categories/server/category-actions";
import { createCategorySchema } from "@/features/categories/schema/category-schema";

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:categories:read`, "read");
  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId") ?? undefined;

  const result = await listCategories(teamId);
  const response = actionResultToResponse(result);
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:categories:write`, "write");
  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError("Validation failed", parsed.error.issues);
  }

  const result = await createCategory(parsed.data);
  const response = actionResultToResponse(result, 201);
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}
