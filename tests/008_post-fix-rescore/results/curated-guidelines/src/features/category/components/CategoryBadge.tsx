import { sanitizeCategoryColor } from "@/features/category/schema/category-schema";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color: string;
  className?: string;
  size?: "sm" | "md";
}

export function CategoryBadge({
  name,
  color,
  className,
  size = "md",
}: CategoryBadgeProps) {
  // Sanitize color to prevent XSS via style injection
  const safeColor = sanitizeCategoryColor(color);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className
      )}
      style={
        safeColor
          ? {
              backgroundColor: safeColor + "20", // 20 = 12.5% opacity
              color: safeColor,
              borderColor: safeColor + "40",
              border: "1px solid",
            }
          : undefined
      }
    >
      {safeColor && (
        <span
          className="inline-block h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: safeColor }}
          aria-hidden="true"
        />
      )}
      {name}
    </span>
  );
}
