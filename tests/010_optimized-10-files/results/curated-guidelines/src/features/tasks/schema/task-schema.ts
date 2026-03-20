import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) > new Date(), {
      message: "Due date must be in the future",
    }),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.string().cuid(),
});

export const UpdateTaskStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(TaskStatus),
  updatedAt: z.string().datetime(), // for optimistic concurrency check
});

export const DeleteTaskSchema = z.object({
  id: z.string().cuid(),
});

export const ListTasksSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  categoryId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;
export type DeleteTaskInput = z.infer<typeof DeleteTaskSchema>;
export type ListTasksInput = z.infer<typeof ListTasksSchema>;
