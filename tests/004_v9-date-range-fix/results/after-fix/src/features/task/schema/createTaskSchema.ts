import { z } from "zod";

export const TaskStatus = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: TaskStatus.default("TODO"),
  priority: TaskPriority.default("MEDIUM"),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .refine(
      (val) => {
        if (val === undefined) return true;
        return new Date(val) > new Date();
      },
      { message: "dueDate must be a future date" }
    ),
  categoryId: z.string().cuid().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
