import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 chars or less"),
  description: z.string().max(2000, "Description must be 2000 chars or less").optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().refine(
    (date) => date > new Date(),
    { message: "Due date must be in the future" }
  ).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  updatedAt: z.coerce.date().optional(), // For optimistic concurrency check
});

export const taskFiltersSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
