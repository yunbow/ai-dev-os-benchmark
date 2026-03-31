type Task = {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  dueDate: string | null;
  createdAt: string;
};

const statusLabel: Record<Task["status"], string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

const statusColor: Record<Task["status"], string> = {
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

export default function TaskTable({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-gray-500">タスクがありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left">タイトル</th>
            <th className="border border-gray-200 px-4 py-2 text-left">説明</th>
            <th className="border border-gray-200 px-4 py-2 text-left">ステータス</th>
            <th className="border border-gray-200 px-4 py-2 text-left">期限</th>
            <th className="border border-gray-200 px-4 py-2 text-left">作成日</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-4 py-2">{task.title}</td>
              <td className="border border-gray-200 px-4 py-2">{task.description}</td>
              <td className="border border-gray-200 px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs ${statusColor[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              </td>
              <td className="border border-gray-200 px-4 py-2">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ja-JP") : "-"}
              </td>
              <td className="border border-gray-200 px-4 py-2">
                {new Date(task.createdAt).toLocaleDateString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
