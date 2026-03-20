import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { getTasks } from "@/features/tasks/server/task-actions";
import { getCategories } from "@/features/categories/server/category-actions";
import { getTeams } from "@/features/teams/server/team-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Tag,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function DashboardStats() {
  const [tasksResult, categoriesResult, teamsResult] = await Promise.all([
    getTasks({ sortBy: "createdAt", sortOrder: "desc", limit: 100 }),
    getCategories(),
    getTeams(),
  ]);

  const tasks = tasksResult.success ? tasksResult.data.tasks : [];
  const categories = categoriesResult.success ? categoriesResult.data : [];
  const teams = teamsResult.success ? teamsResult.data : [];

  const todoCnt = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCnt = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCnt = tasks.filter((t) => t.status === "DONE").length;
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((doneCnt / total) * 100) : 0;

  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== "DONE"
  );

  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500">Total tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{inProgressCnt}</p>
                <p className="text-xs text-gray-500">In progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{doneCnt}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                <p className="text-xs text-gray-500">Completion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No tasks yet.{" "}
                <Link href="/tasks" className="text-indigo-600 hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <p
                      className={`text-sm text-gray-800 truncate max-w-[200px] ${
                        task.status === "DONE" ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <Badge
                      variant={
                        task.status === "DONE"
                          ? "success"
                          : task.status === "IN_PROGRESS"
                          ? "info"
                          : "secondary"
                      }
                      className="shrink-0"
                    >
                      {task.status === "IN_PROGRESS"
                        ? "In Progress"
                        : task.status === "TODO"
                        ? "To Do"
                        : "Done"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview */}
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-red-800">
                  {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? "s" : ""}
                </p>
                <Button variant="link" size="sm" className="px-0 text-red-600" asChild>
                  <Link href="/tasks?status=TODO">View overdue tasks</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Categories</span>
                </div>
                <Badge variant="secondary">{categories.length}</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/categories">Manage categories</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Teams</span>
                </div>
                <Badge variant="secondary">{teams.length}</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/teams">Manage teams</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"}!
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s an overview of your tasks.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        }
      >
        <DashboardStats />
      </Suspense>
    </div>
  );
}
