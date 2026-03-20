"use client";

import React, { useState, useOptimistic, useTransition } from "react";
import { formatDate, isOverdue, sanitizeHexColor } from "@/lib/utils";
import { toggleTaskStatus } from "@/actions/task-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Calendar,
  User,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskStatus, TaskPriority } from "@prisma/client";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    category: { id: string; name: string; color: string } | null;
    assignee: { id: string; name: string | null; email: string } | null;
    creator: { id: string; name: string | null; email: string };
  };
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  canEdit?: boolean;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "outline" | "success" | "warning" | "info" }
> = {
  TODO: { label: "To Do", icon: Circle, variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", icon: Clock, variant: "warning" },
  DONE: { label: "Done", icon: CheckCircle2, variant: "success" },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  HIGH: { label: "High", variant: "destructive" },
  MEDIUM: { label: "Medium", variant: "default" },
  LOW: { label: "Low", variant: "secondary" },
};

const nextStatus: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

export function TaskCard({ task, onEdit, onDelete, canEdit = true }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);

  const statusInfo = statusConfig[optimisticStatus];
  const priorityInfo = priorityConfig[task.priority];
  const StatusIcon = statusInfo.icon;
  const overdue =
    isOverdue(task.dueDate) && optimisticStatus !== "DONE";

  const handleToggleStatus = () => {
    const newStatus = nextStatus[optimisticStatus];
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      const result = await toggleTaskStatus(task.id, newStatus);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Failed to update status",
          description: result.error,
        });
      }
    });
  };

  const safeColor = task.category ? sanitizeHexColor(task.category.color) : null;

  return (
    <article
      className={`rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md ${
        optimisticStatus === "DONE" ? "opacity-75" : ""
      } ${isPending ? "animate-pulse" : ""}`}
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-5 w-5 shrink-0 p-0 text-muted-foreground hover:text-primary"
            onClick={handleToggleStatus}
            disabled={isPending || !canEdit}
            aria-label={`Toggle status: currently ${statusInfo.label}`}
          >
            <StatusIcon className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-medium leading-tight ${
                optimisticStatus === "DONE"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions menu */}
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                aria-label="Task actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onEdit && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>

        {/* Category badge with safe color */}
        {task.category && safeColor && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: `${safeColor}20`,
              color: safeColor,
              border: `1px solid ${safeColor}40`,
            }}
          >
            {task.category.name}
          </span>
        )}

        {/* Due date */}
        {task.dueDate && (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              overdue ? "text-destructive font-medium" : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-3 w-3" aria-hidden="true" />
            <time dateTime={new Date(task.dueDate).toISOString()}>
              {formatDate(task.dueDate)}
            </time>
            {overdue && <span className="sr-only">(overdue)</span>}
          </span>
        )}

        {/* Assignee */}
        {task.assignee && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" aria-hidden="true" />
            {task.assignee.name || task.assignee.email}
          </span>
        )}
      </div>
    </article>
  );
}
