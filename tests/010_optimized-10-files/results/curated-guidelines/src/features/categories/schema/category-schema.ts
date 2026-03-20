import { z } from "zod";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or fewer"),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "Color must be a valid hex code (e.g., #FF5733)"),
  teamId: z.string().cuid().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.string().cuid(),
});

export const DeleteCategorySchema = z.object({
  id: z.string().cuid(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof DeleteCategorySchema>;
