import type { Task } from "../types";

const STATUS_LABELS: Record<Task["status"], string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

const STATUS_STYLES: Record<Task["status"], string> = {
  todo: "background:#f3f4f6;color:#6b7280",
  in_progress: "background:#dbeafe;color:#1d4ed8",
  done: "background:#d1fae5;color:#065f46",
};

type Props = {
  tasks: Task[];
};

export function TaskTable({ tasks }: Props) {
  if (tasks.length === 0) {
    return (
      <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
        タスクがありません。下のフォームから作成してください。
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#374151" }}>タイトル</th>
            <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#374151" }}>説明</th>
            <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#374151" }}>ステータス</th>
            <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#374151" }}>作成日時</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{task.title}</td>
              <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>{task.description ?? "—"}</td>
              <td style={{ padding: "0.75rem 1rem" }}>
                <span
                  style={{
                    ...parseStyles(STATUS_STYLES[task.status]),
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  {STATUS_LABELS[task.status]}
                </span>
              </td>
              <td style={{ padding: "0.75rem 1rem", color: "#6b7280" }}>
                {task.createdAt.toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseStyles(styleStr: string): React.CSSProperties {
  return Object.fromEntries(
    styleStr.split(";").filter(Boolean).map((s) => {
      const [key, value] = s.split(":").map((x) => x.trim());
      const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return [camel, value];
    })
  ) as React.CSSProperties;
}
