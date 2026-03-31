import { Task } from "../types/task";
import { CreateTaskInput } from "../schema/task-schema";

// In-memory store for minimal implementation (replace with Prisma in production)
const tasks: Task[] = [
  {
    id: "1",
    title: "AI Dev OS ガイドラインを読む",
    description: "セキュリティ・バリデーション・プロジェクト構造を確認する",
    status: "done",
    createdAt: new Date("2026-03-29"),
  },
  {
    id: "2",
    title: "タスク一覧画面を実装する",
    status: "in_progress",
    createdAt: new Date("2026-03-30"),
  },
  {
    id: "3",
    title: "コードレビューを依頼する",
    status: "todo",
    createdAt: new Date("2026-03-31"),
  },
];

export async function getTasks(): Promise<Task[]> {
  return [...tasks];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task: Task = {
    id: String(Date.now()),
    title: input.title,
    description: input.description,
    status: "todo",
    createdAt: new Date(),
  };
  tasks.push(task);
  return task;
}
