import { z } from "zod";

// Valid 6-digit hex color validator
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (#RRGGBB)");

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters"),
  color: hexColorSchema,
  teamId: z.string().cuid().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Client-side color validation helper
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Sanitize color value (normalize to uppercase hex)
export function sanitizeColor(color: string): string {
  if (!isValidHexColor(color)) {
    throw new Error("Invalid color format");
  }
  // Normalize to uppercase for consistency
  return `#${color.slice(1).toUpperCase()}`;
}
