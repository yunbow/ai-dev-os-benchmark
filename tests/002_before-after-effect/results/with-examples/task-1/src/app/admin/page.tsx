import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getSession();

  // Require admin role in addition to middleware IP check
  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const [userCount, taskCount, teamCount] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
    prisma.team.count(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Panel</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total users</p>
          <p className="text-3xl font-bold text-gray-900">{userCount}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total tasks</p>
          <p className="text-3xl font-bold text-gray-900">{taskCount}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total teams</p>
          <p className="text-3xl font-bold text-gray-900">{teamCount}</p>
        </div>
      </div>
    </div>
  );
}
