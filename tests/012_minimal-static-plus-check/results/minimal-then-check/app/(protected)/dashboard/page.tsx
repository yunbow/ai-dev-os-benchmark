import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";

export const metadata = { title: "Dashboard - TaskFlow" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [taskCount, overdueCount, teamCount] = await Promise.all([
    prisma.task.count({
      where: { creatorId: userId, status: { not: "DONE" } },
    }),
    prisma.task.count({
      where: {
        creatorId: userId,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.team.count({
      where: { members: { some: { userId } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome back, {session!.user!.name ?? session!.user!.email}
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Open Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{taskCount}</p>
          <Link href="/tasks" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View all tasks →
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Overdue Tasks</p>
          <p className={`text-3xl font-bold mt-1 ${overdueCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {overdueCount}
          </p>
          <Link href="/tasks?status=TODO" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            Review overdue →
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600">Teams</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{teamCount}</p>
          <Link href="/teams" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            Manage teams →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tasks?new=1"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Task
          </Link>
          <Link
            href="/teams?new=1"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Team
          </Link>
          <Link
            href="/categories"
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Manage Categories
          </Link>
        </div>
      </div>
    </div>
  );
}
