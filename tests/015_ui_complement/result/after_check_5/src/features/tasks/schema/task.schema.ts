import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100, "タイトルは100文字以内で入力してください"),
  description: z.string().max(500, "説明は500文字以内で入力してください").optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
