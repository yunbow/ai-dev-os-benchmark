import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100, "タイトルは100文字以内で入力してください"),
  description: z.string().max(500, "説明は500文字以内で入力してください").optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  createdAt: z.date(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
