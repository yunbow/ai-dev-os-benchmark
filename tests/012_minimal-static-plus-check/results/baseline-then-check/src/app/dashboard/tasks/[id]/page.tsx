import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTask } from "@/lib/actions/tasks";
import { getCategories } from "@/lib/actions/categories";
import { prisma } from "@/lib/prisma";
import { TaskForm } from "@/components/tasks/task-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/categories/category-badge";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Task Details" };

const statusConfig = {
  TODO: { label: "To Do", className: "bg-slate-100 text-slate-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  DONE: { label: "Done", className: "bg-green-100 text-green-700" },
};

const priorityConfig = {
  LOW: { label: "Low", className: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", className: "bg-red-100 text-red-700" },
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const userId = session!.user!.id!;

  const result = await getTask(id);
  if (!result.success) notFound();

  const task = result.data;

  const categoriesResult = await getCategories(task.teamId || undefined);
  const categories = categoriesResult.success ? categoriesResult.data : [];

  let teamMembers: { id: string; name: string | null; email: string }[] = [];
  if (task.teamId) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: task.teamId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    teamMembers = members.map((m) => m.user);
  }

  const isCreator = task.creatorId === userId;
  let canEdit = isCreator;

  if (task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: task.teamId, userId } },
    });
    if (membership?.role === "OWNER" || membership?.role === "MEMBER") {
      canEdit = true;
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard/tasks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        aria-label="Back to tasks"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tasks
      </Link>

      <div className="space-y-6">
        {/* Task info */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge
                className={
                  statusConfig[task.status as keyof typeof statusConfig]?.className
                }
              >
                {statusConfig[task.status as keyof typeof statusConfig]?.label}
              </Badge>
              <Badge
                className={
                  priorityConfig[task.priority as keyof typeof priorityConfig]
                    ?.className
                }
              >
                {priorityConfig[task.priority as keyof typeof priorityConfig]?.label}
              </Badge>
              {task.category && <CategoryBadge category={task.category} />}
            </div>
            <CardTitle className="text-2xl">{task.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.description && (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
              {task.dueDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Due: {formatDate(task.dueDate)}</span>
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Assigned to: {task.assignee.name || task.assignee.email}
                  </span>
                </div>
              )}
              <div>
                <span>Created: {formatRelativeTime(task.createdAt)}</span>
              </div>
              <div>
                <span>Updated: {formatRelativeTime(task.updatedAt)}</span>
              </div>
            </div>

            {task.team && (
              <div className="text-sm text-muted-foreground">
                Team:{" "}
                <Link
                  href={`/dashboard/teams/${task.team.id}`}
                  className="text-primary hover:underline"
                >
                  {task.team.name}
                </Link>
              </div>
            )}
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
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  dueDate: task.dueDate,
                  categoryId: task.categoryId,
                  assigneeId: task.assigneeId,
                  teamId: task.teamId,
                  updatedAt: task.updatedAt,
                }}
                categories={categories}
                teamMembers={teamMembers}
                teamId={task.teamId || undefined}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
