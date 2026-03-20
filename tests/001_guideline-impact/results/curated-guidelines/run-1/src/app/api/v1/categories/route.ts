import { NextRequest } from "next/server";
import { requireApiAuth, apiSuccess, apiError, parseBody, handleApiError } from "@/lib/api/api-helpers";
import { createCategoryAction, listCategoriesAction } from "@/features/categories/server/category-actions";
import { createCategorySchema } from "@/features/categories/schema/category-schema";

export async function GET(request: NextRequest) {
  try {
    const { userId, response: authError } = await requireApiAuth();
    if (!userId) return authError!;

    const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
    const result = await listCategoriesAction(teamId);
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
    const { data, response: parseError } = parseBody(createCategorySchema, body);
    if (!data) return parseError!;

    const result = await createCategoryAction(data);
    if (!result.success) {
      return apiError(result.error.code, result.error.message, 400);
    }

    return apiSuccess(result.data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
