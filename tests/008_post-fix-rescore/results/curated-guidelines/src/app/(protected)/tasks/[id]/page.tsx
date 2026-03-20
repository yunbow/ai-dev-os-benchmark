import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/features/category/components/CategoryBadge";
import { fetchTaskById } from "@/features/task/services/task-service";
import { deleteTask } from "@/features/task/server/task-actions";
import { formatDate, isOverdue } from "@/lib/utils";
import {
  Calendar,
  User,
  ArrowLeft,
  Edit,
  AlertCircle,
} from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TaskPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Task" };
  const task = await fetchTaskById(id, session.user.id);
  return { title: task?.title ?? "Task" };
}

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();

  const task = await fetchTaskById(id, session.user.id);
  if (!task) notFound();

  const overdue = isOverdue(task.dueDate) && task.status !== TaskStatus.DONE;
  const canEdit =
    task.creatorId === session.user.id ||
    task.team?.id != null; // simplified; full check in mutation

  return (
    <div className="flex flex-col overflow-hidden">
      <Header title={task.title} />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4">
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/tasks">
                <ArrowLeft className="h-4 w-4" />
                Back to Tasks
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{task.title}</h1>
                  {overdue && (
                    <AlertCircle
                      className="h-5 w-5 text-red-500"
                      aria-label="Overdue"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{statusLabels[task.status]}</Badge>
                  <Badge
                    variant={
                      task.priority === TaskPriority.HIGH
                        ? "destructive"
                        : task.priority === TaskPriority.MEDIUM
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {priorityLabels[task.priority]}
                  </Badge>
                  {task.category && (
                    <CategoryBadge
                      name={task.category.name}
                      color={task.category.color}
                      size="sm"
                    />
                  )}
                </div>
              </div>

              {canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/tasks/${task.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>

            {task.description && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h2>
                <p className="text-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span
                    className={
                      overdue ? "text-red-600 font-medium" : "text-foreground"
                    }
                  >
                    {formatDate(task.dueDate)}
                    {overdue && " (Overdue)"}
                  </span>
                </div>
              )}

              {task.assignee && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {task.assignee.name ?? task.assignee.email}
                  </span>
                </div>
              )}

              <div className="text-muted-foreground">
                <span className="font-medium">Created by: </span>
                {task.creator.name ?? task.creator.email}
              </div>

              {task.team && (
                <div className="text-muted-foreground">
                  <span className="font-medium">Team: </span>
                  <Link
                    href={`/teams/${task.team.id}`}
                    className="text-primary hover:underline"
                  >
                    {task.team.name}
                  </Link>
                </div>
              )}

              <div className="text-muted-foreground text-xs">
                Created {formatDate(task.createdAt)}
              </div>
              <div className="text-muted-foreground text-xs">
                Updated {formatDate(task.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
