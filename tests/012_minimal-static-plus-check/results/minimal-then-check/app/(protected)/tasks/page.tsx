import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { listTasks } from "@/features/tasks/services/task-service";
import { TaskList } from "@/features/tasks/components/task-list";

export const metadata = { title: "Tasks - TaskFlow" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const params = await searchParams;

  const { items, nextCursor, hasMore } = await listTasks(userId, {
    limit: 20,
    status: params.status as "TODO" | "IN_PROGRESS" | "DONE" | undefined,
    priority: params.priority as "LOW" | "MEDIUM" | "HIGH" | undefined,
    search: params.search,
    sortBy: (params.sortBy as "createdAt" | "dueDate" | "priority") ?? "createdAt",
    sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
      </div>
      <Suspense fallback={<div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}</div>}>
        <TaskList initialTasks={items} initialCursor={nextCursor} initialHasMore={hasMore} userId={userId} />
      </Suspense>
    </div>
  );
}
