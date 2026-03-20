"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/utils";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { deleteTaskAction, toggleTaskStatusAction } from "@/actions/task";
import type { TaskWithRelations } from "@/types";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { Pencil, Trash2, RotateCcw } from "lucide-react";

interface TaskDetailProps {
  task: TaskWithRelations;
  canEdit: boolean;
  currentUserId: string;
  categories: { id: string; name: string; color: string }[];
  teams: { id: string; name: string }[];
}

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityVariants: Record<TaskPriority, "default" | "warning" | "destructive" | "secondary"> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

export function TaskDetail({ task, canEdit, currentUserId, categories, teams }: TaskDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);
    try {
      const result = await deleteTaskAction(currentTask.id);
      if (result.success) {
        toast({ title: "Task deleted" });
        router.push("/tasks");
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    // Optimistic update
    const nextStatus =
      currentTask.status === "TODO"
        ? "IN_PROGRESS"
        : currentTask.status === "IN_PROGRESS"
          ? "DONE"
          : "TODO";
    setCurrentTask({ ...currentTask, status: nextStatus as TaskStatus });

    try {
      const result = await toggleTaskStatusAction(currentTask.id, currentTask.updatedAt);
      if (result.success) {
        setCurrentTask(result.data);
        toast({ title: "Status updated" });
      } else {
        // Revert on failure
        setCurrentTask(currentTask);
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Edit Task</h2>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
        <TaskForm
          task={currentTask}
          categories={categories}
          teams={teams}
          currentUserId={currentUserId}
          onSuccess={(updatedTask) => {
            setCurrentTask(updatedTask);
            setIsEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900 break-words">{currentTask.title}</h2>
          </div>
          {canEdit && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                aria-label="Edit task"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:bg-red-50"
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentTask.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{currentTask.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  currentTask.status === "DONE"
                    ? "success"
                    : currentTask.status === "IN_PROGRESS"
                      ? "info"
                      : "secondary"
                }
              >
                {statusLabels[currentTask.status]}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                className="h-6 px-2 text-xs"
                aria-label="Toggle status"
              >
                <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
                Toggle
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
            <Badge variant={priorityVariants[currentTask.priority]}>
              {currentTask.priority}
            </Badge>
          </div>

          {currentTask.category && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentTask.category.color }}
                  aria-hidden="true"
                />
                <span className="text-sm">{currentTask.category.name}</span>
              </div>
            </div>
          )}

          {currentTask.dueDate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
              <p className="text-sm">{formatDate(currentTask.dueDate)}</p>
            </div>
          )}

          {currentTask.assignee && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Assignee</h3>
              <p className="text-sm">{currentTask.assignee.name ?? currentTask.assignee.email}</p>
            </div>
          )}

          {currentTask.team && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Team</h3>
              <p className="text-sm">{currentTask.team.name}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t text-xs text-gray-400 space-y-1">
          <p>Created by {currentTask.creator.name ?? currentTask.creator.email}</p>
          <p>Created {formatDateTime(currentTask.createdAt)}</p>
          <p>Updated {formatDateTime(currentTask.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
