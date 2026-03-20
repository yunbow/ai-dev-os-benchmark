import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { TaskCard } from "@/components/tasks/task-card";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TaskWithRelations } from "@/types";

async function DashboardContent() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [todoCount, inProgressCount, doneCount, upcomingTasks] = await Promise.all([
    db.task.count({ where: { creatorId: userId, status: "TODO" } }),
    db.task.count({ where: { creatorId: userId, status: "IN_PROGRESS" } }),
    db.task.count({ where: { creatorId: userId, status: "DONE" } }),
    db.task.findMany({
      where: {
        creatorId: userId,
        status: { not: "DONE" },
        dueDate: { gte: new Date() },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "To Do", count: todoCount, icon: CheckSquare, color: "text-gray-600" },
    { label: "In Progress", count: inProgressCount, icon: Clock, color: "text-blue-600" },
    { label: "Done", count: doneCount, icon: AlertCircle, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Button asChild>
          <Link href="/tasks/new">New Task</Link>
        </Button>
      </div>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Task statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                <span className="text-sm font-medium text-gray-600">{label}</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="upcoming-heading" className="text-lg font-semibold text-gray-900">
            Upcoming Tasks
          </h2>
          <Link href="/tasks" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {upcomingTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No upcoming tasks"
            description="You have no tasks with due dates coming up."
            actionLabel="Create a task"
            actionHref="/tasks/new"
          />
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <TaskCard key={task.id} task={task as TaskWithRelations} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
