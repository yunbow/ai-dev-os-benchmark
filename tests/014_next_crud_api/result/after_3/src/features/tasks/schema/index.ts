import { z } from "zod";

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  status: TaskStatusSchema.default("todo"),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .refine((val) => new Date(val) > new Date(), {
      message: "dueDate must be in the future",
    })
    .optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: TaskStatusSchema.optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
