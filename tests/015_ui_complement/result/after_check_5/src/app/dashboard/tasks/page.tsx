import { getTasks } from "@/features/tasks/services/task.service";
import { TaskTable } from "@/features/tasks/components/TaskTable";
import { TaskCreateForm } from "@/features/tasks/components/TaskCreateForm";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = getTasks();

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem" }}>タスク一覧</h1>

      <section aria-label="タスク一覧" style={{ marginBottom: "3rem" }}>
        <TaskTable tasks={tasks} />
      </section>

      <section aria-label="タスク作成">
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>新しいタスクを作成</h2>
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1.5rem" }}>
          <TaskCreateForm />
        </div>
      </section>
    </main>
  );
}
