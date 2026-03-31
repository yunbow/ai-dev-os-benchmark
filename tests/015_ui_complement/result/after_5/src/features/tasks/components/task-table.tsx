import type { Task } from "../types";

interface TaskTableProps {
  tasks: Task[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        タスクがありません。最初のタスクを作成してください。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              タイトル
            </th>
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              説明
            </th>
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">
              作成日時
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-900">
                {task.title}
              </td>
              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                {task.description ?? "—"}
              </td>
              <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                {task.createdAt.toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
