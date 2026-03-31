import type { Task } from "../types";
import type { CreateTaskInput } from "../schema/task.schema";

// In-memory store for demo purposes
const tasks: Task[] = [
  {
    id: "1",
    title: "AI Dev OS ガイドラインを読む",
    description: "4層構造の理解を深める",
    status: "done",
    createdAt: new Date("2026-03-29T10:00:00"),
  },
  {
    id: "2",
    title: "Next.js 15 の新機能を調査",
    status: "in_progress",
    createdAt: new Date("2026-03-30T09:00:00"),
  },
  {
    id: "3",
    title: "タスク管理機能を実装",
    description: "Server Component + Client Component の構成",
    status: "todo",
    createdAt: new Date("2026-03-31T08:00:00"),
  },
];

let nextId = 4;

export function getTasks(): Task[] {
  return [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function createTask(input: CreateTaskInput): Task {
  const task: Task = {
    id: String(nextId++),
    title: input.title,
    description: input.description,
    status: input.status,
    createdAt: new Date(),
  };
  tasks.push(task);
  return task;
}
