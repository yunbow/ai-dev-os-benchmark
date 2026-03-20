"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import {
  Calendar,
  User,
  Flag,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryBadge } from "@/components/category-badge";
import { toggleTaskStatus, deleteTask } from "@/actions/tasks";
import { useToast } from "@/components/ui/use-toast";
import type { TaskStatus, TaskPriority } from "@prisma/client";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | string | null;
    updatedAt: Date | string;
    category: { id: string; name: string; color: string } | null;
    assignee: { id: string; name: string | null; email: string; image: string | null } | null;
    creator: { id: string; name: string | null; email: string; image: string | null };
  };
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-slate-100 text-slate-700" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", className: "bg-red-100 text-red-700" },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  TODO: { label: "To Do", icon: Circle },
  IN_PROGRESS: { label: "In Progress", icon: Clock },
  DONE: { label: "Done", icon: CheckCircle2 },
};

const nextStatus: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

export function TaskCard({ task, onDelete, onStatusChange }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(task.status);
  const [optimisticUpdatedAt, setOptimisticUpdatedAt] = useState<Date>(
    task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt)
  );
  const { toast } = useToast();

  const StatusIcon = statusConfig[optimisticStatus].icon;

  function handleStatusToggle() {
    const newStatus = nextStatus[optimisticStatus];
    const previousStatus = optimisticStatus;
    const previousUpdatedAt = optimisticUpdatedAt;

    // Optimistic update
    setOptimisticStatus(newStatus);

    startTransition(async () => {
      const result = await toggleTaskStatus(
        task.id,
        newStatus,
        optimisticUpdatedAt.toISOString()
      );

      if (!result.success) {
        // Rollback
        setOptimisticStatus(previousStatus);
        setOptimisticUpdatedAt(previousUpdatedAt);
        toast({
          title: "Failed to update status",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        setOptimisticUpdatedAt(result.data.updatedAt);
        onStatusChange?.(task.id, newStatus);
        toast({ title: "Task status updated" });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.success) {
        toast({
          title: "Failed to delete task",
          description: result.error,
          variant: "destructive",
        });
      } else {
        onDelete?.(task.id);
        toast({ title: "Task deleted" });
      }
    });
  }

  const priority = priorityConfig[task.priority];
  const dueDateFormatted = task.dueDate
    ? format(new Date(task.dueDate), "MMM d, yyyy")
    : null;
  const isDueDatePast =
    task.dueDate && isPast(new Date(task.dueDate)) && optimisticStatus !== "DONE";
  const isDueDateToday =
    task.dueDate && isToday(new Date(task.dueDate)) && optimisticStatus !== "DONE";

  return (
    <Card
      className={cn(
        "transition-opacity",
        isPending && "opacity-60",
        optimisticStatus === "DONE" && "opacity-75"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status toggle button */}
          <button
            onClick={handleStatusToggle}
            disabled={isPending}
            className={cn(
              "mt-0.5 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              optimisticStatus === "DONE"
                ? "text-green-500"
                : optimisticStatus === "IN_PROGRESS"
                  ? "text-blue-500"
                  : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={`Change status from ${statusConfig[optimisticStatus].label} to ${statusConfig[nextStatus[optimisticStatus]].label}`}
          >
            <StatusIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/tasks/${task.id}`}
                className={cn(
                  "text-sm font-medium hover:underline leading-snug",
                  optimisticStatus === "DONE" &&
                    "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    aria-label="Task options"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/tasks/${task.id}`}>
                      <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Badges and metadata */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Priority badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  priority.className
                )}
              >
                <Flag className="h-3 w-3" aria-hidden="true" />
                {priority.label}
              </span>

              {/* Status badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  optimisticStatus === "DONE" && "bg-green-50 border-green-200 text-green-700",
                  optimisticStatus === "IN_PROGRESS" && "bg-blue-50 border-blue-200 text-blue-700"
                )}
                aria-live="polite"
                aria-atomic="true"
              >
                {statusConfig[optimisticStatus].label}
              </Badge>

              {/* Category badge */}
              {task.category && (
                <CategoryBadge
                  name={task.category.name}
                  color={task.category.color}
                />
              )}
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between mt-2 gap-2">
              {/* Due date */}
              {dueDateFormatted && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isDueDatePast
                      ? "text-red-600 font-medium"
                      : isDueDateToday
                        ? "text-orange-600 font-medium"
                        : "text-muted-foreground"
                  )}
                  aria-label={`Due date: ${dueDateFormatted}${isDueDatePast ? " (overdue)" : isDueDateToday ? " (due today)" : ""}`}
                >
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {dueDateFormatted}
                  {isDueDatePast && " (overdue)"}
                  {isDueDateToday && " (today)"}
                </div>
              )}

              {/* Assignee */}
              {task.assignee && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" aria-hidden="true" />
                  <span className="truncate max-w-[120px]">
                    {task.assignee.name ?? task.assignee.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
