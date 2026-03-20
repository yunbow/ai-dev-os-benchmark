import { z } from "zod";

export const taskStatusValues = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH"] as const;

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
  status: z.enum(taskStatusValues).default("TODO"),
  priority: z.enum(taskPriorityValues).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  updatedAt: z.string().datetime().optional(),
});

export const taskFilterSchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
