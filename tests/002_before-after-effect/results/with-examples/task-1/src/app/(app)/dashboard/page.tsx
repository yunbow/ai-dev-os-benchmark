import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const userId = session.user.id;

  const [taskCount, teamCount, recentTasks] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.team.count({ where: { ownerId: userId } }),
    prisma.task.findMany({
      where: { userId, status: { not: "done" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Welcome back, {session.user.name}
      </h1>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Your tasks</p>
          <p className="text-3xl font-bold text-gray-900">{taskCount}</p>
          <Link href="/tasks" className="mt-2 text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Teams</p>
          <p className="text-3xl font-bold text-gray-900">{teamCount}</p>
          <Link href="/teams" className="mt-2 text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent open tasks</h2>
          <Link href="/tasks/new" className="text-sm text-blue-600 hover:underline">
            + New task
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No open tasks. Great job!</p>
        ) : (
          <ul className="space-y-2">
            {recentTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded border p-3 text-sm"
              >
                <span className="font-medium text-gray-800">{task.title}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    task.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
