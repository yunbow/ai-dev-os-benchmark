"use client";
import { useState, useOptimistic } from "react";
import { format } from "date-fns";
import { Calendar, User, Tag, MoreVertical, CheckCircle2, Circle, Timer } from "lucide-react";
import type { TaskStatus, TaskPriority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toggleTaskStatusAction, deleteTaskAction } from "../server/task-actions";
import { useToast } from "@/hooks/use-toast";

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  TODO: <Circle className="h-4 w-4 text-muted-foreground" />,
  IN_PROGRESS: <Timer className="h-4 w-4 text-blue-500" />,
  DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  updatedAt: Date;
  creator: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
  category: { id: string; name: string; color: string } | null;
}

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
  onUpdated?: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDeleted, onUpdated }: TaskCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticTask, addOptimistic] = useOptimistic(
    task,
    (state, newStatus: TaskStatus) => ({ ...state, status: newStatus })
  );

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
    DONE: "TODO",
  };

  const handleToggleStatus = async () => {
    const newStatus = nextStatus[optimisticTask.status];
    addOptimistic(newStatus);
    setIsLoading(true);
    try {
      const result = await toggleTaskStatusAction(task.id, task.updatedAt.toISOString());
      if (result.success) {
        onUpdated?.(result.data as unknown as Task);
      } else {
        toast({ title: "Failed to update status", description: result.error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteTaskAction(task.id);
      if (result.success) {
        onDeleted?.(task.id);
        toast({ title: "Task deleted" });
      } else {
        toast({ title: "Failed to delete task", description: result.error.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isOverdue = optimisticTask.dueDate && new Date(optimisticTask.dueDate) < new Date() && optimisticTask.status !== "DONE";

  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow", optimisticTask.status === "DONE" && "opacity-75")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={handleToggleStatus}
            disabled={isLoading}
            className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
            aria-label={`Mark as ${statusLabels[nextStatus[optimisticTask.status]]}`}
          >
            {statusIcons[optimisticTask.status]}
          </button>
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium text-sm leading-tight", optimisticTask.status === "DONE" && "line-through text-muted-foreground")}>
              {optimisticTask.title}
            </p>
            {optimisticTask.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{optimisticTask.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Task options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(task)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium", priorityColors[optimisticTask.priority])}>
          {optimisticTask.priority}
        </span>

        {optimisticTask.category && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: optimisticTask.category.color }} aria-hidden="true" />
            {optimisticTask.category.name}
          </span>
        )}

        {optimisticTask.dueDate && (
          <span className={cn("inline-flex items-center gap-1 text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
            <Calendar className="h-3 w-3" />
            {format(new Date(optimisticTask.dueDate), "MMM d")}
          </span>
        )}

        {optimisticTask.assignee && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <User className="h-3 w-3" />
            {optimisticTask.assignee.name || optimisticTask.assignee.email.split("@")[0]}
          </span>
        )}
      </div>
    </div>
  );
}
