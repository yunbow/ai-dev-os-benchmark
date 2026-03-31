import { z } from "zod";

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルは必須です")
    .max(100, "タイトルは100文字以内で入力してください"),
  description: z
    .string()
    .max(500, "説明は500文字以内で入力してください")
    .optional(),
  status: taskStatusSchema.default("todo"),
});

export const taskSchema = createTaskSchema.extend({
  id: z.string(),
  createdAt: z.date(),
});
