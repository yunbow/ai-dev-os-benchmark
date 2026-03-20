import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskList } from "@/features/tasks/components/task-list";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Clock, Tag, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TaskWithRelations } from "@/features/tasks/types/task-types";

export const metadata = {
  title: "Dashboard - TaskFlow",
};

async function DashboardStats({ userId }: { userId: string }) {
  const [totalTasks, inProgressTasks, categories, teams] = await Promise.all([
    prisma.task.count({
      where: { OR: [{ creatorId: userId }, { assigneeId: userId }] },
    }),
    prisma.task.count({
      where: {
        status: "IN_PROGRESS",
        OR: [{ creatorId: userId }, { assigneeId: userId }],
      },
    }),
    prisma.category.count({ where: { userId } }),
    prisma.teamMember.count({ where: { userId } }),
  ]);

  const stats = [
    { label: "Total Tasks", value: totalTasks, icon: CheckSquare, href: "/tasks" },
    { label: "In Progress", value: inProgressTasks, icon: Clock, href: "/tasks?status=IN_PROGRESS" },
    { label: "Categories", value: categories, icon: Tag, href: "/categories" },
    { label: "Teams", value: teams, icon: Users, href: "/teams" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

async function RecentTasks({ userId }: { userId: string }) {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ creatorId: userId }, { assigneeId: userId }],
      status: { not: "DONE" },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    },
  });

  return <TaskList tasks={tasks as TaskWithRelations[]} />;
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0] ?? "there"}!
          </h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your tasks</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">New Task</Link>
        </Button>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats userId={session.user.id} />
      </Suspense>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Tasks</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks">View all</Link>
          </Button>
        </div>
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <RecentTasks userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
