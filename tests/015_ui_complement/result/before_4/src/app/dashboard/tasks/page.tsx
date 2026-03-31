import { Suspense } from "react";
import TaskCreateForm from "@/components/task-create-form";
import TaskTable from "@/components/task-table";

async function getTasks() {
  // In a real app, fetch from DB or API
  const res = await fetch("http://localhost:3000/api/tasks", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
}

async function TaskList() {
  const tasks = await getTasks();

  return <TaskTable tasks={tasks} />;
}

export default function TasksPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">タスク一覧</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">新規タスク作成</h2>
        <TaskCreateForm />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">タスク一覧</h2>
        <Suspense fallback={<div className="text-gray-500">読み込み中...</div>}>
          <TaskList />
        </Suspense>
      </div>
    </div>
  );
}
