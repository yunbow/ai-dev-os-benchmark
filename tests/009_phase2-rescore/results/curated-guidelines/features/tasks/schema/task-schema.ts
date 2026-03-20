import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).default("TODO"),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  cursor: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateTaskFormInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
