import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckSquare, Tag, Users, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - TaskFlow",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [taskStats, categoryCount, teamCount] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: { id: true },
    }),
    prisma.category.count({ where: { userId: session.user.id } }),
    prisma.teamMember.count({ where: { userId: session.user.id } }),
  ]);

  const taskCounts = {
    TODO: taskStats.find((s) => s.status === "TODO")?._count.id ?? 0,
    IN_PROGRESS: taskStats.find((s) => s.status === "IN_PROGRESS")?._count.id ?? 0,
    DONE: taskStats.find((s) => s.status === "DONE")?._count.id ?? 0,
  };
  const totalTasks = taskCounts.TODO + taskCounts.IN_PROGRESS + taskCounts.DONE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name ?? "there"}!
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s an overview of your work.</p>
        </div>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Task
        </Link>
      </div>

      <section aria-label="Task statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            icon={<CheckSquare className="h-5 w-5 text-blue-600" />}
            href="/tasks"
          />
          <StatCard
            label="To Do"
            value={taskCounts.TODO}
            icon={<span className="h-5 w-5 flex items-center justify-center text-yellow-600 font-bold text-xs">TODO</span>}
            href="/tasks?status=TODO"
          />
          <StatCard
            label="In Progress"
            value={taskCounts.IN_PROGRESS}
            icon={<span className="h-5 w-5 flex items-center justify-center text-blue-600 font-bold text-xs">WIP</span>}
            href="/tasks?status=IN_PROGRESS"
          />
          <StatCard
            label="Done"
            value={taskCounts.DONE}
            icon={<span className="h-5 w-5 flex items-center justify-center text-green-600 font-bold text-xs">✓</span>}
            href="/tasks?status=DONE"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section aria-label="Categories and Teams">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-3">
              <Link
                href="/categories"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Tag className="h-5 w-5 text-purple-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Categories</p>
                  <p className="text-xs text-gray-500">{categoryCount} categories</p>
                </div>
              </Link>
              <Link
                href="/teams"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Teams</p>
                  <p className="text-xs text-gray-500">{teamCount} team{teamCount !== 1 ? "s" : ""}</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <span aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900" aria-label={`${value} ${label}`}>
        {value}
      </p>
    </Link>
  );
}
