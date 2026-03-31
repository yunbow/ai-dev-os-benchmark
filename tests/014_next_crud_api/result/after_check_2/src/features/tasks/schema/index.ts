import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

const futureDateString = z
  .string()
  .datetime({ offset: true })
  .refine((val) => new Date(val) > new Date(), {
    message: "dueDate must be in the future",
  });

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  status: taskStatusSchema.optional().default("todo"),
  dueDate: futureDateString.optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: taskStatusSchema.optional(),
  dueDate: futureDateString.optional().nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
