import { getTasks } from "@/features/tasks/server/actions";
import { TaskTable } from "@/features/tasks/components/task-table";
import { TaskCreateForm } from "@/features/tasks/components/task-create-form";

export default async function TasksPage() {
  const result = await getTasks();
  const tasks = result.success ? result.data : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">タスク一覧</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">新しいタスクを作成</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <TaskCreateForm />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          タスク一覧 <span className="text-sm font-normal text-gray-500">({tasks.length}件)</span>
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <TaskTable tasks={tasks} />
        </div>
      </section>
    </div>
  );
}
