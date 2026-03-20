"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleTaskStatusAction, deleteTaskAction } from "@/actions/tasks";
import { toast } from "@/hooks/use-toast";
import { Trash2, Calendar, User } from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: Date | string | null;
    updatedAt: Date | string;
    category?: { id: string; name: string; color: string } | null;
    assignee?: { id: string; name?: string | null; email: string } | null;
    creator: { id: string; name?: string | null; email: string };
  };
  currentUserId: string;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

export function TaskCard({ task, currentUserId }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);

  function handleToggle() {
    const nextStatus = NEXT_STATUS[optimisticStatus];
    setOptimisticStatus(nextStatus);

    startTransition(async () => {
      const result = await toggleTaskStatusAction(
        task.id,
        nextStatus,
        new Date(task.updatedAt),
      );
      if (!result.success) {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (!result.success) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Task deleted" });
      }
    });
  }

  const canDelete = task.creator.id === currentUserId;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && optimisticStatus !== "DONE";

  return (
    <Card className={cn("transition-opacity", isPending && "opacity-60")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium text-sm leading-tight",
                optimisticStatus === "DONE" && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending}
                aria-label="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn("text-xs", PRIORITY_COLORS[task.priority])}
          >
            {task.priority}
          </Badge>

          {task.category && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border"
              style={{
                backgroundColor: `${task.category.color}20`,
                borderColor: task.category.color,
                color: task.category.color,
              }}
            >
              {task.category.name}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {dueDate && (
              <span className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                <Calendar className="h-3 w-3" />
                {dueDate.toLocaleDateString()}
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignee.name ?? task.assignee.email}
              </span>
            )}
          </div>

          <button
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
              "text-xs px-2 py-1 rounded-md font-medium transition-colors",
              optimisticStatus === "TODO" && "bg-slate-100 text-slate-700 hover:bg-slate-200",
              optimisticStatus === "IN_PROGRESS" && "bg-blue-100 text-blue-700 hover:bg-blue-200",
              optimisticStatus === "DONE" && "bg-green-100 text-green-700 hover:bg-green-200",
            )}
            aria-label={`Status: ${STATUS_LABELS[optimisticStatus]}. Click to change.`}
          >
            {STATUS_LABELS[optimisticStatus]}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
