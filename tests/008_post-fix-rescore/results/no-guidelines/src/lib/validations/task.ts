import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable(),
  status: taskStatusSchema.optional().default(TaskStatus.TODO),
  priority: taskPrioritySchema.optional().default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFiltersSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "dueDate", "priority"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
