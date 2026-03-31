import { z } from "zod";

const taskStatus = z.enum(["todo", "in_progress", "done"]);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  status: taskStatus.default("todo"),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .refine((d) => new Date(d) > new Date(), {
      message: "dueDate must be in the future",
    })
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: taskStatus.optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
