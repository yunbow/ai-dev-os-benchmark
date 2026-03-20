import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(5000, "Description too long").optional(),
  status: z.nativeEnum(TaskStatus).default("TODO"),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().max(5000, "Description too long").optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export const TaskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const ToggleTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const SearchTasksSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100),
  cursor: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;
export type SearchTasksInput = z.infer<typeof SearchTasksSchema>;
