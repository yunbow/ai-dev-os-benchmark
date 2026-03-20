import { Category } from "@prisma/client";
import { sanitizeCategoryColor } from "../types/category-types";

interface CategoryBadgeProps {
  category: Pick<Category, "name" | "color">;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const safeColor = sanitizeCategoryColor(category.color);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${className ?? ""}`}
      style={{ backgroundColor: safeColor }}
    >
      {category.name}
    </span>
  );
}
