import { z } from "zod";
import { TaskSchema } from "../schema/task-schema";

export type Task = z.infer<typeof TaskSchema>;
export type TaskStatus = Task["status"];
