import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  description: z.string().max(2000, "Description must be at most 2000 characters").optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z.coerce.date().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFiltersSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  search: z.string().max(200).optional(),
  sortField: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof taskFiltersSchema>;
