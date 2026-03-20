// Color is validated as /^#[0-9A-Fa-f]{6}$/ by Zod schema before being stored.
// CSS hex colors cannot execute scripts, so inline style is safe here.

interface CategoryBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export function CategoryBadge({ name, color, className }: CategoryBadgeProps) {
  // Double-check the hex color format client-side as a defense-in-depth measure
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6b7280";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 ${className ?? ""}`}
    >
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: safeColor }}
        aria-hidden="true"
      />
      {name}
    </span>
  );
}
