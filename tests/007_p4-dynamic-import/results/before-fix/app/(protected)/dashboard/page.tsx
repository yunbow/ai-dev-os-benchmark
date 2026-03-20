import TaskList, { Task } from "./_components/TaskList";
import TaskChart from "./_components/TaskChart";
import CreateTaskDialog from "./_components/CreateTaskDialog";
import RichTextEditor from "./_components/RichTextEditor";

// Mock data — replace with real DB fetch
async function getTasks(): Promise<Task[]> {
  return [
    { id: "1", title: "Design system audit", status: "completed", dueDate: "2026-03-10", description: "" },
    { id: "2", title: "API integration", status: "in-progress", dueDate: "2026-03-25", description: "" },
    { id: "3", title: "Write unit tests", status: "todo", dueDate: "2026-03-30", description: "" },
    { id: "4", title: "Deploy to staging", status: "overdue", dueDate: "2026-03-15", description: "" },
    { id: "5", title: "Code review", status: "todo", dueDate: "2026-03-28", description: "" },
  ];
}

function getSummaryStats(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter((t) => t.status === "overdue").length;
  return { total, completed, overdue };
}

function getChartData(tasks: Task[]) {
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    counts[task.status] = (counts[task.status] ?? 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export default async function DashboardPage() {
  const tasks = await getTasks();
  const { total, completed, overdue } = getSummaryStats(tasks);
  const chartData = getChartData(tasks);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Task Dashboard</h1>
          {/* CreateTaskDialog is a client component — imported directly */}
          <CreateTaskDialog
            onClose={() => {}}
            onCreated={() => {}}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Tasks" value={total} color="blue" />
          <StatCard label="Completed" value={completed} color="green" />
          <StatCard label="Overdue" value={overdue} color="red" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* TaskChart uses recharts — imported directly, no dynamic import */}
          <TaskChart data={chartData} />

          {/* RichTextEditor — heavy component, imported directly */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Quick Note
            </h2>
            <RichTextEditor value="" onChange={() => {}} placeholder="Jot something down..." />
          </div>
        </div>

        {/* Task List */}
        <TaskList initialTasks={tasks} />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "red";
}) {
  const colorMap = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
  };
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
