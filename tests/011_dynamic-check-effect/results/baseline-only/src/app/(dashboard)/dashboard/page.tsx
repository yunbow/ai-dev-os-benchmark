import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskStatus, TaskPriority } from "@prisma/client";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const [taskStats, recentTasks, teamCount] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { creatorId: userId },
      _count: { status: true },
    }),
    prisma.task.findMany({
      where: { OR: [{ creatorId: userId }, { assigneeId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.teamMember.count({ where: { userId } }),
  ]);

  const stats = {
    todo: taskStats.find((s) => s.status === TaskStatus.TODO)?._count.status ?? 0,
    inProgress: taskStats.find((s) => s.status === TaskStatus.IN_PROGRESS)?._count.status ?? 0,
    done: taskStats.find((s) => s.status === TaskStatus.DONE)?._count.status ?? 0,
  };

  const totalTasks = stats.todo + stats.inProgress + stats.done;

  const statusColors: Record<TaskStatus, string> = {
    TODO: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DONE: "bg-green-100 text-green-700",
  };

  const priorityColors: Record<TaskPriority, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user.name ?? "there"}!
        </h1>
        <p className="text-gray-600 mt-1">Here&apos;s an overview of your tasks</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: totalTasks, color: "text-gray-900" },
          { label: "To Do", value: stats.todo, color: "text-gray-600" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
          { label: "Done", value: stats.done, color: "text-green-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks yet</p>
                <Link
                  href="/tasks/new"
                  className="text-indigo-600 hover:underline text-sm mt-2 inline-block"
                >
                  Create your first task
                </Link>
              </div>
            ) : (
              <ul className="space-y-3" role="list">
                {recentTasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {task.category && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: task.category.color }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/tasks"
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                View all tasks →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[
                { href: "/tasks/new", label: "Create New Task", icon: "+" },
                { href: "/tasks", label: "All Tasks", icon: "☑" },
                { href: "/categories", label: "Categories", icon: "🏷" },
                { href: "/teams", label: `Teams (${teamCount})`, icon: "👥" },
                { href: "/teams/new", label: "Create Team", icon: "+" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 hover:text-indigo-600 transition-colors"
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
