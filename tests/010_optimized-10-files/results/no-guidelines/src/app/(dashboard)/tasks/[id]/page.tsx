import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TaskForm } from "@/components/task-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/category-badge";
import { format } from "date-fns";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TaskDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const task = await db.task.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: task?.title ?? "Task Not Found" };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const task = await db.task.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      creator: { select: { id: true, name: true, email: true, image: true } },
      team: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!task) notFound();

  // Check access
  const teamMember = task.team?.members.find((m) => m.userId === userId);
  const hasAccess =
    task.creatorId === userId ||
    task.assigneeId === userId ||
    !!teamMember;

  if (!hasAccess) notFound();

  const canEdit =
    task.creatorId === userId ||
    teamMember?.role === "OWNER" ||
    teamMember?.role === "MEMBER";

  const categories = await db.category.findMany({
    where: {
      OR: [
        { userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Task details view */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex-1">
              <CardTitle className="text-xl">{task.title}</CardTitle>
              <CardDescription className="mt-1">
                Created by {task.creator.name ?? task.creator.email} on{" "}
                {format(task.createdAt, "MMM d, yyyy")}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{task.status.replace("_", " ")}</Badge>
              <Badge
                variant="outline"
                className={
                  task.priority === "HIGH"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : task.priority === "MEDIUM"
                      ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                }
              >
                {task.priority} Priority
              </Badge>
              {task.category && (
                <CategoryBadge
                  name={task.category.name}
                  color={task.category.color}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h2>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {task.dueDate && (
              <div>
                <span className="font-medium text-muted-foreground">Due Date</span>
                <p>{format(task.dueDate, "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
            )}
            {task.assignee && (
              <div>
                <span className="font-medium text-muted-foreground">Assignee</span>
                <p>{task.assignee.name ?? task.assignee.email}</p>
              </div>
            )}
            {task.team && (
              <div>
                <span className="font-medium text-muted-foreground">Team</span>
                <p>{task.team.name}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-muted-foreground">Last Updated</span>
              <p>{format(task.updatedAt, "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              taskId={task.id}
              defaultValues={{
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                dueDate: task.dueDate?.toISOString() ?? null,
                categoryId: task.categoryId,
                assigneeId: task.assigneeId,
                updatedAt: task.updatedAt.toISOString(),
              }}
              categories={categories}
              teamMembers={
                task.team?.members.map((m) => ({
                  user: {
                    id: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                  },
                })) ?? []
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
