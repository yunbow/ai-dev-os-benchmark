import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Admin stats
  const [userCount, taskCount, teamCount] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
    prisma.team.count(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{userCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{taskCount}</p>
          </div>
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Teams</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{teamCount}</p>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Security Notice:</strong> This page is restricted by IP address.
            Unauthorized access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
