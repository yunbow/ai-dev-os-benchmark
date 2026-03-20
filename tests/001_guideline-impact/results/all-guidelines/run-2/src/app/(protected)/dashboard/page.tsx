import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, AlertCircle, ListTodo } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard - TaskFlow" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, recentTasks] =
    await Promise.all([
      prisma.task.count({ where: { OR: [{ creatorId: userId }, { assigneeId: userId }] } }),
      prisma.task.count({ where: { status: "TODO", OR: [{ creatorId: userId }, { assigneeId: userId }] } }),
      prisma.task.count({ where: { status: "IN_PROGRESS", OR: [{ creatorId: userId }, { assigneeId: userId }] } }),
      prisma.task.count({ where: { status: "DONE", OR: [{ creatorId: userId }, { assigneeId: userId }] } }),
      prisma.task.count({
        where: {
          dueDate: { lt: new Date() },
          status: { not: "DONE" },
          OR: [{ creatorId: userId }, { assigneeId: userId }],
        },
      }),
      prisma.task.findMany({
        where: { OR: [{ creatorId: userId }, { assigneeId: userId }] },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { category: true, assignee: { select: { name: true, email: true } } },
      }),
    ]);

  const stats = [
    { label: "Total Tasks", value: totalTasks, icon: ListTodo, color: "text-blue-500" },
    { label: "To Do", value: todoTasks, icon: Clock, color: "text-yellow-500" },
    { label: "In Progress", value: inProgressTasks, icon: CheckSquare, color: "text-purple-500" },
    { label: "Overdue", value: overdueTasks, icon: AlertCircle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session?.user?.name ?? session?.user?.email}</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tasks</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No tasks yet. Create your first task!</p>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div className="flex items-center gap-3 min-w-0">
                    {task.category && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: task.category.color }}
                      />
                    )}
                    <span className="text-sm font-medium truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={task.status === "DONE" ? "secondary" : task.status === "IN_PROGRESS" ? "default" : "outline"} className="text-xs">
                      {task.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${task.priority === "HIGH" ? "border-red-500 text-red-500" : task.priority === "LOW" ? "border-green-500 text-green-500" : "border-yellow-500 text-yellow-500"}`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
