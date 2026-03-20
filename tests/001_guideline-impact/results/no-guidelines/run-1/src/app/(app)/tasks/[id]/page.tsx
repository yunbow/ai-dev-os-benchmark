import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TaskForm } from "@/components/tasks/task-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteTask } from "@/lib/actions/task";
import { formatDate, isOverdue } from "@/lib/utils";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { TaskWithRelations } from "@/types";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusConfig = {
  TODO: { label: "To Do", variant: "secondary" as const },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const },
  DONE: { label: "Done", variant: "success" as const },
};

const priorityConfig = {
  LOW: { label: "Low", variant: "secondary" as const },
  MEDIUM: { label: "Medium", variant: "warning" as const },
  HIGH: { label: "High", variant: "destructive" as const },
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const task = await db.task.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  });

  if (!task) notFound();

  // Authorization check
  const isOwner = task.creatorId === userId;
  if (!isOwner && !task.teamId) notFound();

  const categories = await db.category.findMany({
    where: { userId, teamId: null },
    orderBy: { name: "asc" },
  });

  const overdue = isOverdue(task.dueDate) && task.status !== "DONE";
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Back to tasks
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        {isOwner && (
          <ConfirmDialog
            trigger={<Button variant="destructive" size="sm">Delete</Button>}
            title="Delete task"
            description="Are you sure you want to delete this task? This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={async () => {
              "use server";
              await deleteTask(id);
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
        <Badge variant={priority.variant}>{priority.label}</Badge>
      </div>

      {task.description && (
        <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        {task.dueDate && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span className={overdue ? "text-red-600 font-medium" : ""}>
              {formatDate(task.dueDate)}{overdue ? " (overdue)" : ""}
            </span>
          </div>
        )}
        {task.assignee && (
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-4 w-4" aria-hidden="true" />
            <span>{task.assignee.name ?? task.assignee.email}</span>
          </div>
        )}
        {task.category && (
          <div className="flex items-center gap-2 text-gray-600">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: task.category.color }}
              aria-hidden="true"
            />
            <Tag className="h-4 w-4" aria-hidden="true" />
            <span>{task.category.name}</span>
          </div>
        )}
        <div className="text-gray-500">
          Created {formatDate(task.createdAt)} by {task.creator.name ?? task.creator.email}
        </div>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Task</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm task={task as TaskWithRelations} categories={categories} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
