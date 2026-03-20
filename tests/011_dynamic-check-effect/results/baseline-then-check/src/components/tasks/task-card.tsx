"use client";

import { useState } from "react";
import { Task, Category, User, TaskStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { sanitizeHexColor, formatDate, cn } from "@/lib/utils";
import { toggleTaskStatus, deleteTask } from "@/actions/task";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Calendar, User as UserIcon } from "lucide-react";

type TaskWithRelations = Task & {
  category?: Pick<Category, "id" | "name" | "color"> | null;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};

interface TaskCardProps {
  task: TaskWithRelations;
  canEdit?: boolean;
}

export function TaskCard({ task, canEdit = false }: TaskCardProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(task.status);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  async function handleTaskStatusToggle() {
    const next = STATUS_NEXT[optimisticStatus];
    const previous = optimisticStatus;
    setOptimisticStatus(next); // Optimistic update

    const result = await toggleTaskStatus(task.id, next);
    if (!result.success) {
      setOptimisticStatus(previous); // Rollback
      toast({ variant: "destructive", title: "Failed to update status", description: result.error });
    }
  }

  async function handleTaskDelete() {
    setIsDeleting(true);
    const result = await deleteTask(task.id);
    if (!result.success) {
      setIsDeleting(false);
      toast({ variant: "destructive", title: "Failed to delete task", description: result.error });
    } else {
      toast({ title: "Task deleted" });
    }
  }

  const safeColor = task.category ? sanitizeHexColor(task.category.color) : null;

  return (
    <Card className={cn("transition-opacity", isDeleting && "opacity-50 pointer-events-none")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-snug">{task.title}</h3>
          <div className="flex shrink-0 gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleTaskDelete}
                aria-label="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          <Badge
            className={cn("text-xs cursor-pointer select-none", PRIORITY_COLORS[task.priority])}
            onClick={canEdit ? handleTaskStatusToggle : undefined}
            role={canEdit ? "button" : undefined}
            aria-label={
              canEdit
                ? `Status: ${STATUS_LABELS[optimisticStatus]}. Click to advance.`
                : undefined
            }
            tabIndex={canEdit ? 0 : undefined}
            onKeyDown={
              canEdit ? (e) => e.key === "Enter" && handleTaskStatusToggle() : undefined
            }
          >
            {STATUS_LABELS[optimisticStatus]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {task.priority}
          </Badge>
          {task.category && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
              style={{ borderColor: safeColor ?? undefined }}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: safeColor ?? undefined }}
                aria-hidden="true"
              />
              {task.category.name}
            </span>
          )}
        </div>
      </CardHeader>

      {(task.description || task.dueDate || task.assignee) && (
        <CardContent className="pt-0 space-y-1.5">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1">
                <UserIcon className="h-3 w-3" aria-hidden="true" />
                {task.assignee.name ?? task.assignee.email}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
