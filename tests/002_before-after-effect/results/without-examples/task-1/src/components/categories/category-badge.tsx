import { isValidHexColor } from "@/lib/validations/category";

interface CategoryBadgeProps {
  name: string;
  color: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ name, color, size = "sm" }: CategoryBadgeProps) {
  // Sanitize: only use color if it's a valid hex
  const safeColor = isValidHexColor(color) ? color : "#6B7280";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium ${
        size === "sm" ? "text-xs" : "text-sm"
      }`}
    >
      {/* Safe: safeColor is validated as a hex color pattern, cannot contain XSS */}
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: safeColor }}
        aria-hidden="true"
      />
      {/* Safe: name is rendered as text content, not HTML */}
      {name}
    </span>
  );
}
