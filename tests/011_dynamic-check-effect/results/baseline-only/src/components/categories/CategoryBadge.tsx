import { sanitizeHexColor } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ name, color, size = "md" }: CategoryBadgeProps) {
  // Sanitize color before rendering to prevent XSS/CSS injection
  const safeColor = sanitizeHexColor(color) ?? "#6B7280";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
      style={{
        backgroundColor: `${safeColor}20`,
        color: safeColor,
        borderColor: `${safeColor}40`,
        border: "1px solid",
      }}
    >
      <span
        className={`rounded-full ${size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"}`}
        style={{ backgroundColor: safeColor }}
        aria-hidden="true"
      />
      {name}
    </span>
  );
}
