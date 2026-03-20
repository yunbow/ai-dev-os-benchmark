import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

export const CreateTaskSchema = z.object({
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
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  updatedAt: z.coerce.date().optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const TaskFiltersSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type TaskFiltersInput = z.infer<typeof TaskFiltersSchema>;

export const ToggleTaskStatusSchema = z.object({
  taskId: z.string().cuid(),
  newStatus: z.nativeEnum(TaskStatus),
  updatedAt: z.coerce.date(),
});

export type ToggleTaskStatusInput = z.infer<typeof ToggleTaskStatusSchema>;
