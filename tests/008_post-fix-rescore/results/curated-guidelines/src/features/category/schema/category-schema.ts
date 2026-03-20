import { z } from "zod";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name must be at most 50 characters"),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Color must be a valid 6-digit hex color (e.g. #FF5733)"),
  teamId: z.string().cuid().optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export function sanitizeCategoryColor(color: string): string | null {
  if (HEX_COLOR_REGEX.test(color)) {
    return color.toUpperCase();
  }
  return null;
}
