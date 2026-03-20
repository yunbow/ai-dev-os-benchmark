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
  getTask,
  updateTask,
  deleteTask,
} from "@/features/tasks/server/task-actions";
import { updateTaskSchema } from "@/features/tasks/schema/task-schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:tasks:read`, "read");
  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  const { id } = await params;
  const result = await getTask(id);
  const response = actionResultToResponse(result);
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:tasks:write`, "write");
  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError("Invalid JSON body");
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError("Validation failed", parsed.error.issues);
  }

  const { id } = await params;
  const result = await updateTask(id, parsed.data);
  const response = actionResultToResponse(result);
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return apiUnauthorized();

  const ip = getClientIp(request);
  const rateLimitResult = checkRateLimit(`${ip}:tasks:write`, "write");
  if (!rateLimitResult.allowed) {
    return apiRateLimited(rateLimitResult.retryAfter ?? 60);
  }

  const { id } = await params;
  const result = await deleteTask(id);

  if (!result.success) {
    return actionResultToResponse(result);
  }

  const response = new Response(null, { status: 204 });
  setRateLimitHeaders(response.headers, rateLimitResult);
  return response;
}
