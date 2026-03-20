import { z } from "zod";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be 50 characters or less"),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid 6-digit hex code (e.g. #FF5733)"),
  teamId: z.string().cuid().optional().nullable(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
