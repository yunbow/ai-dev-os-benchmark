import { CreateTaskInput, Task } from "../types/task";

// インメモリストア（最小構成）
const store: Task[] = [
  {
    id: "1",
    title: "AI Dev OS ガイドラインを読む",
    description: "プロジェクト構造・バリデーション・セキュリティの章を確認する",
    status: "done",
    createdAt: new Date("2026-03-29"),
  },
  {
    id: "2",
    title: "タスク一覧画面を実装する",
    description: "Server Component + Client Component の組み合わせで実装",
    status: "in_progress",
    createdAt: new Date("2026-03-30"),
  },
  {
    id: "3",
    title: "フォームバリデーションを追加する",
    status: "todo",
    createdAt: new Date("2026-03-31"),
  },
];

let nextId = store.length + 1;

export async function getTasks(): Promise<Task[]> {
  // 実際の DB クエリを模倣する遅延
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [...store].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task: Task = {
    id: String(nextId++),
    title: input.title,
    description: input.description,
    status: input.status ?? "todo",
    createdAt: new Date(),
  };
  store.push(task);
  return task;
}
