import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TaskWithRelations } from "@/lib/types";
import { TaskStatus, Priority } from "@prisma/client";
import { Calendar, User } from "lucide-react";

interface TaskCardProps {
  task: TaskWithRelations;
}

const priorityColors: Record<Priority, "destructive" | "default" | "secondary" | "outline"> = {
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
};

const statusColors: Record<TaskStatus, "default" | "secondary" | "outline" | "destructive"> = {
  TODO: "secondary",
  IN_PROGRESS: "default",
  DONE: "outline",
};

export function TaskCard({ task }: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== TaskStatus.DONE;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{task.title}</h3>
          {task.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
          <Badge variant={statusColors[task.status]}>
            {task.status.replace("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        {task.dueDate && (
          <span
            className={`flex items-center gap-1 ${isOverdue ? "text-red-600" : ""}`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && " (overdue)"}
          </span>
        )}

        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.assignee.name ?? task.assignee.email}
          </span>
        )}

        {task.category && (
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: task.category.color }}
            />
            {task.category.name}
          </span>
        )}
      </div>
    </Link>
  );
}
