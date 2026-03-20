"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Tag,
  User,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { TaskWithRelations } from "../types/task-types";
import type { TaskStatus } from "@prisma/client";

const statusConfig = {
  TODO: {
    label: "To Do",
    icon: Circle,
    badge: "secondary" as const,
    next: "IN_PROGRESS" as TaskStatus,
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock,
    badge: "info" as const,
    next: "DONE" as TaskStatus,
  },
  DONE: {
    label: "Done",
    icon: CheckCircle2,
    badge: "success" as const,
    next: "TODO" as TaskStatus,
  },
};

const priorityConfig = {
  LOW: { label: "Low", badge: "secondary" as const },
  MEDIUM: { label: "Medium", badge: "warning" as const },
  HIGH: { label: "High", badge: "destructive" as const },
};

interface TaskCardProps {
  task: TaskWithRelations;
  onToggleStatus: (task: TaskWithRelations, newStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: TaskWithRelations) => void;
}

export function TaskCard({
  task,
  onToggleStatus,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const statusInfo = statusConfig[task.status];
  const StatusIcon = statusInfo.icon;
  const priorityInfo = priorityConfig[task.priority];

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Status toggle button */}
        <button
          onClick={() => onToggleStatus(task, statusInfo.next)}
          className="mt-0.5 shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
          aria-label={`Mark as ${statusConfig[statusInfo.next].label}`}
        >
          <StatusIcon
            className={
              task.status === "DONE"
                ? "text-green-500 h-5 w-5"
                : task.status === "IN_PROGRESS"
                ? "text-blue-500 h-5 w-5"
                : "h-5 w-5"
            }
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-medium text-gray-900 ${
                task.status === "DONE" ? "line-through text-gray-400" : ""
              }`}
            >
              {task.title}
            </h3>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Task options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className={
                    confirmDelete
                      ? "text-red-600 focus:text-red-600"
                      : "text-gray-700"
                  }
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {confirmDelete ? "Click again to confirm" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusInfo.badge}>{statusInfo.label}</Badge>
            <Badge variant={priorityInfo.badge}>{priorityInfo.label}</Badge>

            {task.category && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border border-gray-200">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: task.category.color }}
                />
                <Tag className="h-3 w-3 text-gray-400" />
                {task.category.name}
              </span>
            )}

            {task.assignee && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <User className="h-3 w-3" />
                {task.assignee.name ?? task.assignee.email}
              </span>
            )}

            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  new Date(task.dueDate) < new Date() && task.status !== "DONE"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
