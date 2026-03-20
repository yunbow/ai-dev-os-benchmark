import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid 6-digit hex code (e.g. #FF5733)"),
  teamId: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
