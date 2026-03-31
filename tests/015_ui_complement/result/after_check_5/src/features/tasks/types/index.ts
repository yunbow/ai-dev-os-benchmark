import { z } from "zod";
import { createTaskSchema } from "../schema/task.schema";

export type { CreateTaskInput } from "../schema/task.schema";

export type TaskStatus = z.infer<typeof createTaskSchema>["status"];

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
};
