"use client";

import React, { useState, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/categories/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Calendar, User, Trash2, Edit, CheckCircle } from "lucide-react";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    creator: { id: string; name: string | null; email: string };
    assignee: { id: string; name: string | null; email: string } | null;
    category: { id: string; name: string; color: string } | null;
    team: { id: string; name: string } | null;
  };
  onDelete?: (id: string) => void;
}

const statusConfig = {
  TODO: { label: "To Do", className: "bg-slate-100 text-slate-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  DONE: { label: "Done", className: "bg-green-100 text-green-700" },
};

const priorityConfig = {
  LOW: { label: "Low", className: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
  HIGH: { label: "High", className: "bg-red-100 text-red-700" },
};

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);

  const nextStatus =
    task.status === "TODO"
      ? "IN_PROGRESS"
      : task.status === "IN_PROGRESS"
      ? "DONE"
      : "TODO";

  const handleStatusToggle = () => {
    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      const result = await updateTaskStatus({
        id: task.id,
        status: nextStatus,
        updatedAt: task.updatedAt.toISOString(),
      });
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast({ title: "Task deleted", variant: "default" });
        onDelete?.(task.id);
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const currentStatus = optimisticStatus as keyof typeof statusConfig;
  const priority = task.priority as keyof typeof priorityConfig;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/tasks/${task.id}`}
            className="font-semibold text-sm hover:underline line-clamp-2 flex-1"
            aria-label={`View task: ${task.title}`}
          >
            {task.title}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Task options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/tasks/${task.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit task
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleStatusToggle} disabled={isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as {statusConfig[nextStatus as keyof typeof statusConfig]?.label}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isPending}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          <Badge className={statusConfig[currentStatus]?.className}>
            {statusConfig[currentStatus]?.label}
          </Badge>
          <Badge className={priorityConfig[priority]?.className}>
            {priorityConfig[priority]?.label}
          </Badge>
          {task.category && <CategoryBadge category={task.category} />}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${
                isOverdue ? "text-red-500 font-medium" : ""
              }`}
            >
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <span>{isOverdue ? "Overdue: " : ""}{formatDate(task.dueDate)}</span>
            </div>
          )}

          {task.assignee && (
            <div className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[8px]">
                  {task.assignee.name?.[0]?.toUpperCase() ||
                    task.assignee.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{task.assignee.name || task.assignee.email}</span>
            </div>
          )}

          {task.team && (
            <span className="text-muted-foreground">{task.team.name}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
