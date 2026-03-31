import { getTasks } from "@/app/actions/tasks";
import TaskForm from "./TaskForm";

const statusLabel: Record<string, string> = {
  pending: "未着手",
  in_progress: "進行中",
  done: "完了",
};

const statusStyle: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">タスク一覧</h1>

      <TaskForm />

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">タスクがありません</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">タイトル</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">作成日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{task.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{task.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
