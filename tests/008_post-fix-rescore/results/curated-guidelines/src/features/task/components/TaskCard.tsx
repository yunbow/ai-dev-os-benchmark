"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, User, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/features/category/components/CategoryBadge";
import { toggleTaskStatus } from "@/features/task/server/task-actions";
import { toast } from "@/hooks/useToast";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { TaskWithRelations } from "@/features/task/services/task-service";
import { TaskStatus, TaskPriority } from "@prisma/client";

interface TaskCardProps {
  task: TaskWithRelations;
  onUpdate?: (updated: TaskWithRelations) => void;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; variant: "default" | "secondary" | "success" | "outline" }
> = {
  TODO: { label: "To Do", variant: "outline" },
  IN_PROGRESS: { label: "In Progress", variant: "info" as "default" },
  DONE: { label: "Done", variant: "success" },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: { label: "Low", className: "text-green-600" },
  MEDIUM: { label: "Medium", className: "text-yellow-600" },
  HIGH: { label: "High", className: "text-red-600" },
};

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(
    task.status
  );
  const [isToggling, setIsToggling] = useState(false);

  const currentStatus = optimisticStatus;
  const overdue = isOverdue(task.dueDate) && currentStatus !== TaskStatus.DONE;

  async function handleStatusToggle(newStatus: TaskStatus) {
    if (isToggling) return;

    const prevStatus = optimisticStatus;
    setOptimisticStatus(newStatus); // Optimistic update
    setIsToggling(true);

    try {
      const result = await toggleTaskStatus({
        taskId: task.id,
        newStatus,
        updatedAt: task.updatedAt,
      });

      if (result.success) {
        onUpdate?.(result.data);
        toast({ title: "Status updated", variant: "default" });
      } else {
        setOptimisticStatus(prevStatus); // Rollback
        toast({
          title: result.error.message,
          variant: "destructive",
        });
      }
    } catch {
      setOptimisticStatus(prevStatus);
      toast({ title: "Failed to update status", variant: "destructive" });
    } finally {
      setIsToggling(false);
    }
  }

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    TODO: TaskStatus.IN_PROGRESS,
    IN_PROGRESS: TaskStatus.DONE,
    DONE: TaskStatus.TODO,
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        overdue && "border-red-200 bg-red-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/tasks/${task.id}`}
              className="font-medium text-foreground hover:underline truncate"
            >
              {task.title}
            </Link>
            {overdue && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" aria-label="Overdue" />
            )}
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button
              onClick={() => handleStatusToggle(nextStatus[currentStatus])}
              disabled={isToggling}
              className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
              aria-label={`Change status from ${currentStatus}`}
            >
              <Badge
                variant={
                  statusConfig[currentStatus].variant as
                    | "default"
                    | "secondary"
                    | "outline"
                    | "destructive"
                    | undefined
                }
                className={cn(
                  "cursor-pointer transition-opacity",
                  isToggling && "opacity-50"
                )}
              >
                {statusConfig[currentStatus].label}
              </Badge>
            </button>

            <span
              className={cn(
                "text-xs font-medium",
                priorityConfig[task.priority].className
              )}
            >
              {priorityConfig[task.priority].label} priority
            </span>

            {task.category && (
              <CategoryBadge
                name={task.category.name}
                color={task.category.color}
                size="sm"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "text-red-600 font-medium"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.assignee.name ?? task.assignee.email}
            </span>
          )}
        </div>
        {task.team && (
          <span className="text-muted-foreground">{task.team.name}</span>
        )}
      </div>
    </div>
  );
}
