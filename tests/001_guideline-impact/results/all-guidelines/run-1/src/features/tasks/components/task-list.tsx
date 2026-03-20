"use client";

import { useState, useOptimistic, useTransition } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit,
  AlertCircle,
  Minus,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleTaskStatus, deleteTask } from "../server/task-actions";
import type { TaskStatus, TaskPriority } from "@prisma/client";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
  createdAt: Date;
  updatedAt: Date;
};

const statusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; next: TaskStatus }
> = {
  TODO: { label: "To Do", icon: Circle, next: "IN_PROGRESS" },
  IN_PROGRESS: { label: "In Progress", icon: Clock, next: "DONE" },
  DONE: { label: "Done", icon: CheckCircle2, next: "TODO" },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; icon: React.ElementType; className: string }
> = {
  LOW: { label: "Low", icon: Minus, className: "text-muted-foreground" },
  MEDIUM: { label: "Medium", icon: ChevronUp, className: "text-blue-500" },
  HIGH: {
    label: "High",
    icon: AlertCircle,
    className: "text-destructive",
  },
};

interface TaskListProps {
  tasks: TaskItem[];
  onEdit?: (task: TaskItem) => void;
  onRefresh?: () => void;
}

export function TaskList({ tasks, onEdit, onRefresh }: TaskListProps) {
  const [, startTransition] = useTransition();
  const [optimisticTasks, updateOptimisticTask] = useOptimistic(
    tasks,
    (state, { id, status }: { id: string; status: TaskStatus }) =>
      state.map((t) => (t.id === id ? { ...t, status } : t))
  );

  const handleStatusToggle = async (task: TaskItem) => {
    const nextStatus = statusConfig[task.status].next;

    startTransition(async () => {
      updateOptimisticTask({ id: task.id, status: nextStatus });
      await toggleTaskStatus(task.id, nextStatus);
      onRefresh?.();
    });
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    await deleteTask(taskId);
    onRefresh?.();
  };

  if (optimisticTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2
          className="mb-4 h-12 w-12 text-muted-foreground"
          aria-hidden="true"
        />
        <h3 className="text-lg font-semibold">No tasks found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new task to get started
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Task list">
      {optimisticTasks.map((task) => {
        const StatusIcon = statusConfig[task.status].icon;
        const PriorityIcon = priorityConfig[task.priority].icon;
        const isOverdue =
          task.dueDate &&
          new Date(task.dueDate) < new Date() &&
          task.status !== "DONE";

        return (
          <li
            key={task.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors",
              task.status === "DONE" && "opacity-60"
            )}
          >
            <button
              onClick={() => handleStatusToggle(task)}
              className={cn(
                "mt-0.5 flex-shrink-0 rounded-full transition-colors",
                task.status === "DONE"
                  ? "text-green-500 hover:text-muted-foreground"
                  : "text-muted-foreground hover:text-primary"
              )}
              aria-label={`Mark as ${statusConfig[task.status].next.toLowerCase().replace("_", " ")}`}
            >
              <StatusIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    "font-medium leading-tight",
                    task.status === "DONE" && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <PriorityIcon
                    className={cn(
                      "h-4 w-4",
                      priorityConfig[task.priority].className
                    )}
                    aria-label={`${priorityConfig[task.priority].label} priority`}
                  />
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(task)}
                      aria-label={`Edit task: ${task.title}`}
                    >
                      <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(task.id)}
                    aria-label={`Delete task: ${task.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {task.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {task.category && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${task.category.color}20`,
                      color: task.category.color,
                    }}
                    aria-label={`Category: ${task.category.name}`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: task.category.color }}
                      aria-hidden="true"
                    />
                    {task.category.name}
                  </span>
                )}

                {task.dueDate && (
                  <span
                    className={cn(
                      "text-xs",
                      isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                    )}
                    aria-label={`Due: ${format(new Date(task.dueDate), "MMM d, yyyy")}`}
                  >
                    {isOverdue && (
                      <AlertCircle className="inline h-3 w-3 mr-1" aria-hidden="true" />
                    )}
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </span>
                )}

                {task.assignee && (
                  <span className="text-xs text-muted-foreground">
                    Assigned to: {task.assignee.name ?? task.assignee.email}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
