import { z } from "zod";

// Strict 6-digit hex color validation
export const hexColorSchema = z
  .string()
  .regex(
    /^#[0-9A-Fa-f]{6}$/,
    "Color must be a valid hex color (e.g., #FF5733)"
  );

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  color: hexColorSchema.default("#6366f1"),
  teamId: z.string().cuid().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
