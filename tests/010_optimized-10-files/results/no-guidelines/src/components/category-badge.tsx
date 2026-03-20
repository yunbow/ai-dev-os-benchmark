import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color: string;
  className?: string;
}

/**
 * Sanitize a hex color string to prevent XSS via style injection.
 * Only allows valid 6-digit hex colors (#RRGGBB).
 */
function sanitizeHexColor(color: string): string | null {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (hexPattern.test(color)) {
    return color;
  }
  return null;
}

/**
 * Calculate contrasting text color (black or white) based on background color luminance.
 */
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  const safeColor = sanitizeHexColor(color);

  if (!safeColor) {
    // Fallback rendering if color is invalid
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800",
          className
        )}
      >
        {name}
      </span>
    );
  }

  const textColor = getContrastColor(safeColor);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: safeColor,
        color: textColor,
      }}
    >
      {name}
    </span>
  );
}
