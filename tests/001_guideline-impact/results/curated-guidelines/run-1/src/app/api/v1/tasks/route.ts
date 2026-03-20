import { NextRequest } from "next/server";
import { requireApiAuth, apiSuccess, apiError, parseQueryParams, parseBody, handleApiError } from "@/lib/api/api-helpers";
import { createTaskAction, listTasksAction } from "@/features/tasks/server/task-actions";
import { listTasksSchema, createTaskSchema } from "@/features/tasks/schema/task-schema";

export async function GET(request: NextRequest) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const { data: params, response: parseError } = parseQueryParams(
      listTasksSchema,
      request.nextUrl.searchParams
    );
    if (!params) return parseError!;

    const result = await listTasksAction(params);
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
    const { data, response: parseError } = parseBody(createTaskSchema, body);
    if (!data) return parseError!;

    const result = await createTaskAction(data);
    if (!result.success) {
      return apiError(result.error.code, result.error.message, 400);
    }

    return apiSuccess(result.data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
