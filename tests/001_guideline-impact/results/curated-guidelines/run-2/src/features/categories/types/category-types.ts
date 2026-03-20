import { Category } from "@prisma/client";

export type CategoryWithCount = Category & {
  _count?: { tasks: number };
};

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export function sanitizeCategoryColor(color: string): string {
  if (hexColorRegex.test(color)) {
    return color;
  }
  return "#6366f1"; // fallback to default
}
