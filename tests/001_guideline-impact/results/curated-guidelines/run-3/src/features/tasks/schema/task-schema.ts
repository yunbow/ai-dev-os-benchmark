import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const TaskSchema = z.object({
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
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.coerce.date().optional().nullable(),
  categoryId: z.string().cuid("Invalid category ID").optional().nullable(),
  assigneeId: z.string().cuid("Invalid assignee ID").optional().nullable(),
  teamId: z.string().cuid("Invalid team ID").optional().nullable(),
});

export const UpdateTaskSchema = TaskSchema.partial();

export const TaskFiltersSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "dueDate", "priority", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  teamId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type TaskInput = z.infer<typeof TaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskFiltersInput = z.infer<typeof TaskFiltersSchema>;
