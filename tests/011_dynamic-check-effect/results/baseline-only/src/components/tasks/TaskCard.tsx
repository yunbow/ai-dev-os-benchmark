"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteTaskAction, toggleTaskStatusAction } from "@/actions/task";
import type { TaskWithRelations } from "@/types";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Calendar, Trash2, RotateCcw, User } from "lucide-react";

interface TaskCardProps {
  task: TaskWithRelations;
  canEdit: boolean;
  onDelete?: (id: string) => void;
  onStatusChange?: (task: TaskWithRelations) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityVariants: Record<
  TaskPriority,
  "default" | "warning" | "destructive" | "secondary"
> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

export function TaskCard({ task, canEdit, onDelete, onStatusChange }: TaskCardProps) {
  const { toast } = useToast();
  const [currentTask, setCurrentTask] = useState(task);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this task?")) return;
    setIsDeleting(true);
    try {
      const result = await deleteTaskAction(currentTask.id);
      if (result.success) {
        toast({ title: "Task deleted" });
        onDelete?.(currentTask.id);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTogglingStatus(true);

    const nextStatus =
      currentTask.status === "TODO"
        ? "IN_PROGRESS"
        : currentTask.status === "IN_PROGRESS"
          ? "DONE"
          : "TODO";

    const optimistic = { ...currentTask, status: nextStatus as TaskStatus };
    setCurrentTask(optimistic);

    try {
      const result = await toggleTaskStatusAction(currentTask.id, currentTask.updatedAt);
      if (result.success) {
        setCurrentTask(result.data);
        onStatusChange?.(result.data);
      } else {
        setCurrentTask(currentTask);
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const isOverdue =
    currentTask.dueDate &&
    new Date(currentTask.dueDate) < new Date() &&
    currentTask.status !== "DONE";

  return (
    <article className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/tasks/${currentTask.id}`}
          className="flex-1 min-w-0 group"
        >
          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 truncate">
            {currentTask.title}
          </h3>
          {currentTask.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{currentTask.description}</p>
          )}
        </Link>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            aria-label={`Toggle status (currently ${statusLabels[currentTask.status]})`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge
          variant={
            currentTask.status === "DONE"
              ? "success"
              : currentTask.status === "IN_PROGRESS"
                ? "info"
                : "secondary"
          }
          className="text-xs"
        >
          {statusLabels[currentTask.status]}
        </Badge>
        <Badge variant={priorityVariants[currentTask.priority]} className="text-xs">
          {currentTask.priority}
        </Badge>
        {currentTask.category && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentTask.category.color }}
              aria-hidden="true"
            />
            {currentTask.category.name}
          </span>
        )}
        {currentTask.dueDate && (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              isOverdue ? "text-red-500 font-medium" : "text-gray-500"
            }`}
          >
            <Calendar className="h-3 w-3" aria-hidden="true" />
            {isOverdue ? "Overdue: " : ""}
            {formatDate(currentTask.dueDate)}
          </span>
        )}
        {currentTask.assignee && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <User className="h-3 w-3" aria-hidden="true" />
            {currentTask.assignee.name ?? currentTask.assignee.email}
          </span>
        )}
      </div>
    </article>
  );
}
