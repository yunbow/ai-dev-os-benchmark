import React from "react";
import { sanitizeHexColor } from "@/lib/utils";

interface CategoryBadgeProps {
  category: {
    id: string;
    name: string;
    color: string;
  };
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  // Sanitize color to prevent XSS
  const safeColor = sanitizeHexColor(category.color);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${safeColor}20`,
        color: safeColor,
        border: `1px solid ${safeColor}40`,
      }}
    >
      <span
        className="h-2 w-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: safeColor }}
        aria-hidden="true"
      />
      {category.name}
    </span>
  );
}
