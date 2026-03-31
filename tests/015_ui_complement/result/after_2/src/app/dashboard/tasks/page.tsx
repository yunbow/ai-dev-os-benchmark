import { getTasks } from "@/features/tasks/services/task-service";
import { TaskTable } from "@/features/tasks/components/task-table";
import { TaskForm } from "@/features/tasks/components/task-form";

// page.tsx はデータ受け渡しのみ（project-structure.md 準拠）
export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">タスク一覧</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TaskForm />
        </div>
        <div className="lg:col-span-2">
          <TaskTable tasks={tasks} />
        </div>
      </div>
    </main>
  );
}
