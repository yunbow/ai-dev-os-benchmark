"use server";

import { prisma } from "@/lib/prisma/client";
import { withAction, requireAuth, ActionResult } from "@/lib/actions/action-helpers";
import { ActionErrors } from "@/lib/actions/errors";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../schema/category-schema";
import { Category } from "@prisma/client";

export async function createCategory(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const parsed = CreateCategorySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const { teamId, ...rest } = parsed.data;

    // If teamId provided, verify membership
    if (teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!membership || membership.role === "VIEWER") {
        return { success: false, error: ActionErrors.forbidden() };
      }
    }

    const category = await prisma.category.create({
      data: {
        ...rest,
        userId: teamId ? null : session.user.id,
        teamId: teamId ?? null,
      },
    });

    return { success: true, data: category };
  });
}

export async function getCategories(teamId?: string): Promise<ActionResult<Category[]>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          ...(teamId
            ? [{ teamId }]
            : [
                {
                  teamId: {
                    in: (
                      await prisma.teamMember.findMany({
                        where: { userId: session.user.id },
                        select: { teamId: true },
                      })
                    ).map((m) => m.teamId),
                  },
                },
              ]),
        ],
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: categories };
  });
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return { success: false, error: ActionErrors.notFound("Category") };
    }

    // IDOR: user owns the category, or is OWNER/MEMBER of the team
    if (category.userId && category.userId !== session.user.id) {
      return { success: false, error: ActionErrors.forbidden() };
    }

    if (category.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: category.teamId, userId: session.user.id } },
      });
      if (!membership || membership.role === "VIEWER") {
        return { success: false, error: ActionErrors.forbidden() };
      }
    }

    const parsed = UpdateCategorySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: ActionErrors.validationError(
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        ),
      };
    }

    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    return { success: true, data: updated };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult<{ id: string }>> {
  return withAction(async () => {
    const authResult = await requireAuth();
    if (!authResult.success) return authResult;
    const { data: session } = authResult;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return { success: false, error: ActionErrors.notFound("Category") };
    }

    // IDOR check
    if (category.userId && category.userId !== session.user.id) {
      return { success: false, error: ActionErrors.forbidden() };
    }

    if (category.teamId) {
      const membership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: category.teamId, userId: session.user.id } },
      });
      if (!membership || membership.role !== "OWNER") {
        return { success: false, error: ActionErrors.forbidden() };
      }
    }

    await prisma.category.delete({ where: { id } });

    return { success: true, data: { id } };
  });
}
