import { z } from "zod";

export const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be at most 50 characters"),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid 6-digit hex code (e.g. #FF5733)"),
  teamId: z.string().cuid().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
