import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Clock, Circle, Users, Tag, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function DashboardStats({ userId }: { userId: string }) {
  const [todoCount, inProgressCount, doneCount, teamCount, categoryCount] =
    await Promise.all([
      prisma.task.count({
        where: {
          status: "TODO",
          OR: [
            { creatorId: userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      }),
      prisma.task.count({
        where: {
          status: "IN_PROGRESS",
          OR: [
            { creatorId: userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      }),
      prisma.task.count({
        where: {
          status: "DONE",
          OR: [
            { creatorId: userId },
            { team: { members: { some: { userId } } } },
          ],
        },
      }),
      prisma.team.count({
        where: { members: { some: { userId } } },
      }),
      prisma.category.count({
        where: {
          OR: [{ userId }, { team: { members: { some: { userId } } } }],
        },
      }),
    ]);

  const stats = [
    {
      title: "To Do",
      value: todoCount,
      icon: Circle,
      color: "text-slate-500",
      bgColor: "bg-slate-100",
    },
    {
      title: "In Progress",
      value: inProgressCount,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Done",
      value: doneCount,
      icon: CheckSquare,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Teams",
      value: teamCount,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      title: "Categories",
      value: categoryCount,
      icon: Tag,
      color: "text-orange-500",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function RecentTasks({ userId }: { userId: string }) {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { creatorId: userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      category: { select: { name: true, color: true } },
    },
  });

  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        No tasks yet.{" "}
        <Link href="/dashboard/tasks/new" className="text-primary hover:underline">
          Create your first task
        </Link>
        .
      </p>
    );
  }

  const statusColors: Record<string, string> = {
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DONE: "bg-green-100 text-green-700",
  };

  return (
    <ul className="space-y-2" aria-label="Recent tasks">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/dashboard/tasks/${task.id}`}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  statusColors[task.status]
                }`}
              >
                {task.status.replace("_", " ")}
              </span>
              <span className="text-sm truncate">{task.title}</span>
            </div>
            <ArrowRight
              className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const userName = session!.user!.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {userName || "there"}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your tasks and teams.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats userId={userId} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tasks">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              }
            >
              <RecentTasks userId={userId} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button asChild className="justify-start h-auto py-3 px-4">
                <Link href="/dashboard/tasks/new">
                  <CheckSquare className="mr-3 h-5 w-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Create new task</p>
                    <p className="text-xs opacity-80">Add a new task to your list</p>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto py-3 px-4">
                <Link href="/dashboard/teams">
                  <Users className="mr-3 h-5 w-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Manage teams</p>
                    <p className="text-xs text-muted-foreground">View and manage your teams</p>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" asChild className="justify-start h-auto py-3 px-4">
                <Link href="/dashboard/categories">
                  <Tag className="mr-3 h-5 w-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Manage categories</p>
                    <p className="text-xs text-muted-foreground">Organize with categories</p>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
