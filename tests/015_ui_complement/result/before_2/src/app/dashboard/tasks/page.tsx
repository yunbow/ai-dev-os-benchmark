import { db } from "@/db";
import { tasks } from "@/db/schema";
import { desc } from "drizzle-orm";
import TaskForm from "./TaskForm";

export default async function TasksPage() {
  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt));

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>タスク一覧</h1>

      <TaskForm />

      {allTasks.length === 0 ? (
        <p>タスクがありません。</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>タイトル</th>
              <th style={th}>説明</th>
              <th style={th}>ステータス</th>
              <th style={th}>期限日</th>
              <th style={th}>作成日時</th>
            </tr>
          </thead>
          <tbody>
            {allTasks.map((task) => (
              <tr key={task.id}>
                <td style={td}>{task.id}</td>
                <td style={td}>{task.title}</td>
                <td style={td}>{task.description ?? "-"}</td>
                <td style={td}>{task.status}</td>
                <td style={td}>{task.dueDate ?? "-"}</td>
                <td style={td}>{task.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

const th: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "8px",
  background: "#f5f5f5",
  textAlign: "left",
};

const td: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "8px",
};
