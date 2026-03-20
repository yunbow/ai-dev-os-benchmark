import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
  status: z.nativeEnum(TaskStatus).default("TODO"),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  search: z.string().max(200).optional(),
  cursor: z.string().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;
