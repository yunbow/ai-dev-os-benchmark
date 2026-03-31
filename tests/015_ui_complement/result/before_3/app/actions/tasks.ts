"use server";

export type Task = {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "done";
  createdAt: string;
};

// In-memory store (resets on server restart — demo only)
const tasks: Task[] = [
  { id: 1, title: "Next.js 15 のセットアップ", status: "done", createdAt: "2026-03-29" },
  { id: 2, title: "App Router の調査", status: "in_progress", createdAt: "2026-03-30" },
  { id: 3, title: "タスク一覧画面の実装", status: "pending", createdAt: "2026-03-31" },
];
let nextId = 4;

export async function getTasks(): Promise<Task[]> {
  // Simulate async data fetch
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [...tasks];
}

export async function createTask(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const title = (formData.get("title") as string | null)?.trim();

  if (!title) return { error: "タイトルを入力してください" };
  if (title.length < 2) return { error: "タイトルは2文字以上で入力してください" };
  if (title.length > 100) return { error: "タイトルは100文字以内で入力してください" };

  tasks.push({ id: nextId++, title, status: "pending", createdAt: new Date().toISOString().slice(0, 10) });
  return { success: true };
}
