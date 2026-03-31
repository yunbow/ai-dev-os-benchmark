import { z } from "zod";
import { createTaskSchema, taskSchema, taskStatusSchema } from "../schema/task";

export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type Task = z.infer<typeof taskSchema>;
