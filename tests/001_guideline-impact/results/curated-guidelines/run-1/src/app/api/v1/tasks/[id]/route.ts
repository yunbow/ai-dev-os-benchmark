import { NextRequest } from "next/server";
import { requireApiAuth, apiSuccess, apiError, parseBody, handleApiError } from "@/lib/api/api-helpers";
import {
  getTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/features/tasks/server/task-actions";
import { updateTaskSchema } from "@/features/tasks/schema/task-schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const { id } = await params;
    const result = await getTaskAction(id);
    if (!result.success) {
      const status = result.error.code === "NOT_FOUND" ? 404 : 400;
      return apiError(result.error.code, result.error.message, status);
    }

    return apiSuccess(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const { data, response: parseError } = parseBody(updateTaskSchema, body);
    if (!data) return parseError!;

    const result = await updateTaskAction(id, data);
    if (!result.success) {
      const status =
        result.error.code === "NOT_FOUND" ? 404 :
        result.error.code === "FORBIDDEN" ? 403 :
        result.error.code === "CONFLICT" ? 409 : 400;
      return apiError(result.error.code, result.error.message, status);
    }

    return apiSuccess(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const { id } = await params;
    const result = await deleteTaskAction(id);
    if (!result.success) {
      const status =
        result.error.code === "NOT_FOUND" ? 404 :
        result.error.code === "FORBIDDEN" ? 403 : 400;
      return apiError(result.error.code, result.error.message, status);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
