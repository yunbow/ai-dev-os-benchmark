import { Task } from "../types/task";

const statusLabel: Record<Task["status"], string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

const statusClass: Record<Task["status"], string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

type Props = {
  tasks: Task[];
};

export function TaskTable({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">タスクがありません</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              タイトル
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              説明
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              ステータス
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              作成日
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                {task.title}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {task.description ?? "—"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass[task.status]}`}
                >
                  {statusLabel[task.status]}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {task.createdAt.toLocaleDateString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
