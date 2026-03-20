import { z } from "zod";

export const CategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name must be at most 50 characters")
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color (e.g. #FF5733)"),
  teamId: z.string().cuid("Invalid team ID").optional().nullable(),
});

export const UpdateCategorySchema = CategorySchema.partial();

export type CategoryInput = z.infer<typeof CategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
