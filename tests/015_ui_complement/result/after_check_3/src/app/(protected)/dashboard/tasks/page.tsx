import { Suspense } from "react";
import { TaskTable } from "@/features/tasks/components/TaskTable";
import { TaskCreateForm } from "@/features/tasks/components/TaskCreateForm";

export default function TasksPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">タスク一覧</h1>

      <section className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">タスクを作成</h2>
        <TaskCreateForm />
      </section>

      <section className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">タスク一覧</h2>
        </div>
        <Suspense fallback={<TaskTableSkeleton />}>
          <TaskTable />
        </Suspense>
      </section>
    </div>
  );
}

function TaskTableSkeleton() {
  return (
    <div className="p-6 space-y-3" aria-label="読み込み中">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}
