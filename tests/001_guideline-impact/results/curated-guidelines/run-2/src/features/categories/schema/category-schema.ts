import { z } from "zod";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g., #6366f1)")
    .default("#6366f1"),
  teamId: z.string().cuid().optional().nullable(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long").optional(),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color (e.g., #6366f1)")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
