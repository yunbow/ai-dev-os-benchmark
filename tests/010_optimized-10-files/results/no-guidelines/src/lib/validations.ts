import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .trim()
    .optional()
    .nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: "Invalid date format" }
    )
    .transform((val) => (val ? new Date(val) : null)),
  categoryId: z.string().cuid("Invalid category ID").optional().nullable(),
  assigneeId: z.string().cuid("Invalid assignee ID").optional().nullable(),
  teamId: z.string().cuid("Invalid team ID").optional().nullable(),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const updateTaskSchema = taskSchema.partial().extend({
  updatedAt: z
    .string()
    .datetime({ message: "Invalid updatedAt format" })
    .optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be at most 50 characters")
    .trim(),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hex color (e.g. #FF5733)"
    ),
  teamId: z.string().cuid("Invalid team ID").optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const teamSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be at most 100 characters")
    .trim(),
});

export type TeamInput = z.infer<typeof teamSchema>;

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase(),
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

export const toggleTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  updatedAt: z.string().datetime({ message: "Invalid updatedAt format" }),
});

export type ToggleTaskStatusInput = z.infer<typeof toggleTaskStatusSchema>;
