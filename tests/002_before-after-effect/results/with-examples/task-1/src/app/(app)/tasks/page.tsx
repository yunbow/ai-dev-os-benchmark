import Link from "next/link";
import { getUserTasks } from "@/lib/actions/tasks";
import { TaskList } from "@/components/tasks/task-list";

export default async function TasksPage() {
  const result = await getUserTasks();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <Link
          href="/tasks/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + New task
        </Link>
      </div>

      {!result.success ? (
        <p className="text-red-600">{result.error}</p>
      ) : (
        <TaskList tasks={result.data} />
      )}
    </div>
  );
}
