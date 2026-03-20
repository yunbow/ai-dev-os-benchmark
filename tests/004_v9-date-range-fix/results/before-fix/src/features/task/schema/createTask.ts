import { z } from "zod";

export const TaskStatus = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const TaskPriority = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
  status: TaskStatus.default("TODO"),
  priority: TaskPriority.default("MEDIUM"),
  dueDate: z.coerce.date().optional(),
  categoryId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
