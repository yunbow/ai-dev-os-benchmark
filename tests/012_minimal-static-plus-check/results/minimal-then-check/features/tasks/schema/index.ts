import { z } from "zod";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueDate: z
    .coerce
    .date()
    .refine((date) => date > new Date(), {
      message: "Due date must be in the future",
    })
    .optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  updatedAt: z.coerce.date().optional(),
});

export const listTasksSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  search: z.string().max(200, "Search query too long").optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
