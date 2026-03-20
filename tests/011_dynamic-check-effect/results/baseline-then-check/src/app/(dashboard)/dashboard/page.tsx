import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, Clock, AlertCircle, Users } from "lucide-react";
import Link from "next/link";

async function DashboardStats({ userId }: { userId: string }) {
  const [todoCount, inProgressCount, overdueCount, teamCount] = await Promise.all([
    db.task.count({ where: { creatorId: userId, status: "TODO" } }),
    db.task.count({ where: { creatorId: userId, status: "IN_PROGRESS" } }),
    db.task.count({
      where: {
        creatorId: userId,
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
      },
    }),
    db.teamMember.count({ where: { userId } }),
  ]);

  const stats = [
    { label: "To Do", value: todoCount, icon: CheckSquare, href: "/tasks?status=TODO", color: "text-blue-500" },
    { label: "In Progress", value: inProgressCount, icon: Clock, href: "/tasks?status=IN_PROGRESS", color: "text-yellow-500" },
    { label: "Overdue", value: overdueCount, icon: AlertCircle, href: "/tasks", color: "text-red-500" },
    { label: "Teams", value: teamCount, icon: Users, href: "/teams", color: "text-green-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, href, color }) => (
        <Link key={label} href={href}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function RecentTasks({ userId }: { userId: string }) {
  const tasks = await db.task.findMany({
    where: {
      OR: [{ creatorId: userId }, { assigneeId: userId }],
      status: { not: "DONE" },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      category: { select: { name: true, color: true } },
    },
  });

  if (tasks.length === 0) {
    return <p className="text-muted-foreground text-sm">No active tasks. <Link href="/tasks" className="text-primary hover:underline">Create one!</Link></p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-3 p-3 rounded-md border">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{task.title}</p>
            <p className="text-xs text-muted-foreground capitalize">{task.status.replace("_", " ").toLowerCase()}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${task.priority === "HIGH" ? "bg-red-100 text-red-700" : task.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
            {task.priority}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name ?? session?.user?.email}
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats userId={userId} />
      </Suspense>

      <section aria-labelledby="recent-tasks-heading">
        <h2 id="recent-tasks-heading" className="text-lg font-semibold mb-3">Recent Tasks</h2>
        <Suspense fallback={<div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>}>
          <RecentTasks userId={userId} />
        </Suspense>
      </section>
    </div>
  );
}
