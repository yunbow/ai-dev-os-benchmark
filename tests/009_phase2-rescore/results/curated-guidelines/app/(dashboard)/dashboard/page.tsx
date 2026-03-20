import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getTasks } from "@/features/tasks/server/task-actions";
import TaskList from "@/components/tasks/TaskList";
import CreateTaskButton from "@/components/tasks/CreateTaskButton";

async function TasksSection() {
  const result = await getTasks({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (!result.success) {
    return <p className="text-red-600">Failed to load tasks: {result.error.message}</p>;
  }

  return <TaskList initialData={result.data} />;
}

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || "User"}
        </h1>
        <CreateTaskButton />
      </div>
      <Suspense fallback={
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      }>
        <TasksSection />
      </Suspense>
    </div>
  );
}
