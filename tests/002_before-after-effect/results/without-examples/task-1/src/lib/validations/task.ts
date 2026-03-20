import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.coerce.date().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  updatedAt: z.coerce.date().optional(), // For optimistic concurrency
});

export const toggleTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  updatedAt: z.coerce.date(), // For concurrency check
});

export const taskFiltersSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  teamId: z.string().cuid().optional(),
  cursor: z.string().cuid().optional(),
  sortField: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskStatusInput = z.infer<typeof toggleTaskStatusSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
