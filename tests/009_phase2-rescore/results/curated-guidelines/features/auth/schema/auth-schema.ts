import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include uppercase letter")
    .regex(/[a-z]/, "Password must include lowercase letter")
    .regex(/[0-9]/, "Password must include number")
    .regex(/[^A-Za-z0-9]/, "Password must include special character"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include uppercase letter")
    .regex(/[a-z]/, "Password must include lowercase letter")
    .regex(/[0-9]/, "Password must include number")
    .regex(/[^A-Za-z0-9]/, "Password must include special character"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
