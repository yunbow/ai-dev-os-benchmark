import { getTasks } from "../services/task-service";

const STATUS_LABELS: Record<string, string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

export async function TaskTable() {
  const tasks = await getTasks();

  if (tasks.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">タスクがありません</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">タイトル</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">説明</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">ステータス</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">作成日</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">{task.title}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{task.description ?? "—"}</td>
              <td className="px-4 py-3 text-sm">
                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {STATUS_LABELS[task.status] ?? task.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {task.createdAt.toLocaleDateString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
