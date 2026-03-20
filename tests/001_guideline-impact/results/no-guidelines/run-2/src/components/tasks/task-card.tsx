"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, AlertCircle, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleTaskStatus, deleteTask } from "@/actions/tasks";
import type { TaskWithRelations } from "@/types";
import { TaskStatus, Priority } from "@prisma/client";

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityColors: Record<Priority, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

interface TaskCardProps {
  task: TaskWithRelations;
  currentUserId: string;
}

export function TaskCard({ task, currentUserId }: TaskCardProps) {
  const [optimisticStatus, setOptimisticStatus] = useState(task.status);
  const [optimisticUpdatedAt, setOptimisticUpdatedAt] = useState(task.updatedAt.toISOString());
  const [isPending, startTransition] = useTransition();

  const canModify = task.creatorId === currentUserId;

  function handleToggle() {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "DONE",
      DONE: "TODO",
    };

    const previous = optimisticStatus;
    setOptimisticStatus(nextStatus[optimisticStatus]);

    startTransition(async () => {
      const result = await toggleTaskStatus(task.id, optimisticUpdatedAt);
      if (!result.success) {
        setOptimisticStatus(previous);
        toast.error(result.error);
      } else {
        setOptimisticUpdatedAt(result.data.updatedAt.toISOString());
      }
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this task?")) return;
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.success) toast.error(result.error);
      else toast.success("Task deleted");
    });
  }

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && optimisticStatus !== "DONE";

  return (
    <article
      className={cn(
        "group rounded-lg border bg-[var(--color-card)] p-4 shadow-sm transition-shadow hover:shadow-md",
        optimisticStatus === "DONE" && "opacity-70"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-label={`Mark task as ${statusLabels[optimisticStatus === "DONE" ? "TODO" : optimisticStatus === "TODO" ? "IN_PROGRESS" : "DONE"]}`}
          className={cn(
            "mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
            optimisticStatus === "DONE"
              ? "border-green-500 bg-green-500"
              : optimisticStatus === "IN_PROGRESS"
              ? "border-blue-500 bg-blue-100"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
          )}
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin mx-auto text-[var(--color-muted-foreground)]" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/tasks/${task.id}`}
              className={cn(
                "font-medium hover:text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:underline",
                optimisticStatus === "DONE" && "line-through text-[var(--color-muted-foreground)]"
              )}
            >
              {task.title}
            </Link>

            {canModify && (
              <div className="flex items-center gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                  <Link href={`/dashboard/tasks/${task.id}`} aria-label="Edit task">
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--color-destructive)]"
                  onClick={handleDelete}
                  disabled={isPending}
                  aria-label="Delete task"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                priorityColors[task.priority]
              )}
              aria-label={`Priority: ${task.priority}`}
            >
              {task.priority}
            </span>

            <Badge variant="outline" className="text-xs">
              {statusLabels[optimisticStatus]}
            </Badge>

            {task.category && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: task.category.color }}
                aria-label={`Category: ${task.category.name}`}
              >
                {task.category.name}
              </span>
            )}

            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-[var(--color-destructive)]" : "text-[var(--color-muted-foreground)]"
                )}
              >
                {isOverdue && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
                <CalendarDays className="h-3 w-3" aria-hidden="true" />
                <time dateTime={new Date(task.dueDate).toISOString()}>
                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                </time>
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
