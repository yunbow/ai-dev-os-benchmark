import { z } from "zod";

export const taskIdSchema = z.string().uuid();

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: taskStatusSchema.default("todo"),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .refine((val) => !val || new Date(val) > new Date(), {
      message: "dueDate must be in the future",
    }),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
