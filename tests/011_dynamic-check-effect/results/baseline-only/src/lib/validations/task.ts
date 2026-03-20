import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

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
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  updatedAt: z.coerce.date().optional(),
});

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
