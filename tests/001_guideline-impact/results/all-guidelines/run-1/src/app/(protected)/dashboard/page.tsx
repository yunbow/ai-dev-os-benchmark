import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckSquare, Tag, Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard - TaskFlow",
};

async function getDashboardStats(userId: string) {
  const [totalTasks, todoTasks, inProgressTasks, doneTasks, categories, teams] =
    await Promise.all([
      prisma.task.count({ where: { creatorId: userId } }),
      prisma.task.count({ where: { creatorId: userId, status: "TODO" } }),
      prisma.task.count({ where: { creatorId: userId, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { creatorId: userId, status: "DONE" } }),
      prisma.category.count({ where: { userId } }),
      prisma.teamMember.count({ where: { userId } }),
    ]);

  const overdueTasks = await prisma.task.count({
    where: {
      creatorId: userId,
      status: { not: "DONE" },
      dueDate: { lt: new Date() },
    },
  });

  return {
    totalTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    categories,
    teams,
    overdueTasks,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats(session!.user!.id!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {session?.user?.name ?? "there"}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your tasks and activity.
        </p>
      </div>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.inProgressTasks} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todoTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.doneTasks} completed
              </p>
            </CardContent>
          </Card>

          {stats.overdueTasks > 0 && (
            <Card className="border-destructive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-destructive">
                  Overdue
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {stats.overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
              <p className="text-xs text-muted-foreground">Active categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teams}</div>
              <p className="text-xs text-muted-foreground">Team memberships</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
