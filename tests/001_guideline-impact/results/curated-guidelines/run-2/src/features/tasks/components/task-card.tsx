"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, User, Tag } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskStatusToggle } from "./task-status-toggle";
import { TaskWithRelations, STATUS_LABELS, PRIORITY_LABELS } from "../types/task-types";
import { sanitizeCategoryColor } from "@/features/categories/types/category-types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithRelations;
  onStatusChange?: (id: string, status: "TODO" | "IN_PROGRESS" | "DONE") => void;
}

const priorityColors = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

const statusColors = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/tasks/${task.id}`}
            className="font-semibold hover:underline line-clamp-2 flex-1"
          >
            {task.title}
          </Link>
          <TaskStatusToggle
            task={task}
            onStatusChange={onStatusChange}
          />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColors[task.status])}>
            {STATUS_LABELS[task.status]}
          </span>
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", priorityColors[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.category && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: sanitizeCategoryColor(task.category.color) }}
            >
              <Tag className="h-3 w-3" />
              {task.category.name}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        <div className="flex w-full items-center justify-between gap-2">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{task.assignee.name ?? task.assignee.email}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1 ml-auto">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
