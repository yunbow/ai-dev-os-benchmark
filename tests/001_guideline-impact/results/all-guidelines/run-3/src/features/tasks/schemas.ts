import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const TaskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  status: z.nativeEnum(TaskStatus).default("TODO"),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  dueDate: z.coerce.date().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  teamId: z.string().cuid().optional().nullable(),
});

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  categoryId: z.string().cuid().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  updatedAt: z.coerce.date().optional(), // for optimistic concurrency check
});

export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;

export const TaskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional().nullable(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type TaskFilterInput = z.infer<typeof TaskFilterSchema>;

export const ToggleStatusSchema = z.object({
  taskId: z.string().cuid(),
  expectedUpdatedAt: z.coerce.date().optional(), // optimistic concurrency
});

export type ToggleStatusInput = z.infer<typeof ToggleStatusSchema>;
