import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TaskStatus, Priority } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Dashboard - TaskFlow",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Get task counts and recent tasks - no N+1 with single queries
  const [taskStats, recentTasks, teams] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: {
        OR: [{ creatorId: userId }, { assigneeId: userId }],
      },
      _count: { status: true },
    }),
    prisma.task.findMany({
      where: {
        OR: [{ creatorId: userId }, { assigneeId: userId }],
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          select: { id: true, name: true, _count: { select: { members: true } } },
        },
      },
      take: 5,
    }),
  ]);

  const stats = {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.DONE]: 0,
  };
  for (const s of taskStats) {
    stats[s.status] = s._count.status;
  }
  const totalTasks = Object.values(stats).reduce((a, b) => a + b, 0);

  const priorityColors: Record<Priority, string> = {
    HIGH: "destructive",
    MEDIUM: "default",
    LOW: "secondary",
  };

  const statusColors: Record<TaskStatus, string> = {
    TODO: "secondary",
    IN_PROGRESS: "default",
    DONE: "outline",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, {session.user.name ?? session.user.email}
          </p>
        </div>
        <Button asChild>
          <Link href="/tasks">View All Tasks</Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">To Do</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats[TaskStatus.TODO]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats[TaskStatus.IN_PROGRESS]}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Done</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats[TaskStatus.DONE]}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tasks</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/tasks">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No tasks yet.</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/tasks">Create your first task</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge variant={priorityColors[task.priority] as "destructive" | "default" | "secondary" | "outline"}>
                        {task.priority}
                      </Badge>
                      <Badge variant={statusColors[task.status] as "default" | "secondary" | "outline" | "destructive"}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Teams</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/teams">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No teams yet.</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/teams">Create or join a team</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map(({ team, role }) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{team.name}</p>
                      <p className="text-xs text-gray-500">
                        {team._count.members} member{team._count.members !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{role}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
