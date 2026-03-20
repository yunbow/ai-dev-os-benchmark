"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { Calendar, User, Tag } from "lucide-react";
import type { TaskWithRelations } from "@/types";

const statusConfig = {
  TODO: { label: "To Do", variant: "secondary" as const },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const },
  DONE: { label: "Done", variant: "success" as const },
};

const priorityConfig = {
  LOW: { label: "Low", variant: "secondary" as const },
  MEDIUM: { label: "Medium", variant: "warning" as const },
  HIGH: { label: "High", variant: "destructive" as const },
};

interface TaskCardProps {
  task: TaskWithRelations;
}

export function TaskCard({ task }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate) && task.status !== "DONE";
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/tasks/${task.id}`}
            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
          >
            {task.title}
          </Link>
          {task.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
          )}
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <Badge variant={priority.variant} className="text-xs">
          {priority.label}
        </Badge>

        {task.category && (
          <span className="flex items-center gap-1">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: task.category.color }}
              aria-hidden="true"
            />
            <Tag className="h-3 w-3" aria-hidden="true" />
            {task.category.name}
          </span>
        )}

        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1",
              overdue && "text-red-600 font-medium"
            )}
            aria-label={`Due ${formatDate(task.dueDate)}${overdue ? " (overdue)" : ""}`}
          >
            <Calendar className="h-3 w-3" aria-hidden="true" />
            {formatDate(task.dueDate)}
            {overdue && " (overdue)"}
          </span>
        )}

        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            {task.assignee.name ?? task.assignee.email}
          </span>
        )}
      </div>
    </article>
  );
}
