import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TaskList } from "@/components/dashboard/TaskList";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

// Heavy chart component (recharts > 50KB) — deferred, no SSR needed
const TaskChart = dynamic(() => import("@/components/dashboard/TaskChart"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded" />,
});

// Modal/dialog — not visible on initial load, loaded on demand
const CreateTaskDialog = dynamic(
  () => import("@/components/dashboard/CreateTaskDialog")
);

// Rich text editor — heavy component, only needed when editing
const RichTextEditor = dynamic(
  () => import("@/components/dashboard/RichTextEditor"),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse bg-muted rounded" />,
  }
);

async function getTaskStats() {
  // Server-side data fetch — stays in RSC, never reaches the client bundle
  const res = await fetch(`${process.env.API_BASE_URL}/api/tasks/stats`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch task stats");
  return res.json() as Promise<{
    total: number;
    completed: number;
    overdue: number;
  }>;
}

async function getTasks() {
  const res = await fetch(`${process.env.API_BASE_URL}/api/tasks`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json() as Promise<Task[]>;
}

export default async function DashboardPage() {
  // Parallel fetches — no waterfall
  const [stats, tasks] = await Promise.all([getTaskStats(), getTasks()]);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {/* Dialog chunk is fetched only after hydration */}
        <CreateTaskDialog />
      </div>

      {/* Summary stats — lightweight, rendered on the server */}
      <StatsCards stats={stats} />

      {/* Task list — Client Component, receives only minimal serializable props */}
      <Suspense fallback={<LoadingSkeleton />}>
        <TaskList initialTasks={tasks} />
      </Suspense>

      {/* Chart — heavy recharts dependency, deferred */}
      <section>
        <h2 className="text-lg font-medium mb-3">Task Distribution</h2>
        <TaskChart tasks={tasks} />
      </section>

      {/* Rich text editor — heavy component shown conditionally in edit flows */}
      <section>
        <h2 className="text-lg font-medium mb-3">Task Description</h2>
        <RichTextEditor />
      </section>
    </main>
  );
}
