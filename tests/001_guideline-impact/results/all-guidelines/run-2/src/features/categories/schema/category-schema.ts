import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code (e.g. #FF5733)"),
  teamId: z.string().cuid().optional().nullable(),
});

export const UpdateCategorySchema = CategorySchema.extend({
  id: z.string().cuid(),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
