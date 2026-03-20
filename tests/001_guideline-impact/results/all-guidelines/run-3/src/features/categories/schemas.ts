import { z } from "zod";

// Validate hex color: must be exactly #RRGGBB format
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code (e.g., #FF5733)");

export const CategoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  color: hexColorSchema,
  teamId: z.string().cuid().optional().nullable(),
});

export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: hexColorSchema.optional(),
});

export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;
