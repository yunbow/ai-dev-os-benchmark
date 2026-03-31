export type { CreateTaskInput } from "../schema/task-schema";

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionFailure {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;
