"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteTask } from "@/actions/task-actions";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import type { Category, Task, TaskStatus, TaskPriority } from "@prisma/client";

type TaskWithRelations = Task & {
  category: { id: string; name: string; color: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  creator: { id: string; name: string | null; email: string };
};

interface TaskListProps {
  tasks: TaskWithRelations[];
  categories: Pick<Category, "id" | "name" | "color">[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  currentUserId: string;
  teamId?: string;
}

export function TaskList({
  tasks,
  categories,
  nextCursor,
  hasMore,
  total,
  currentUserId,
  teamId,
}: TaskListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Task form dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Delete confirmation dialog
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const editingTask = editingTaskId
    ? tasks.find((t) => t.id === editingTaskId)
    : null;

  const handleLoadMore = () => {
    if (!nextCursor) return;
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", nextCursor);
      router.push(`?${params.toString()}`);
    });
  };

  const handleDelete = async () => {
    if (!deletingTaskId) return;
    setIsDeleting(true);
    try {
      const result = await deleteTask(deletingTaskId);
      if (result.success) {
        toast({
          variant: "success",
          title: "Task deleted",
          description: "Task has been deleted successfully.",
        });
        setDeletingTaskId(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = (task: TaskWithRelations) => {
    return task.creatorId === currentUserId;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "task" : "tasks"}
        </p>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          size="sm"
          aria-label="Create new task"
        >
          <Plus className="mr-2 h-4 w-4" />
          New task
        </Button>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No tasks found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new task to get started.
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="mt-4"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create task
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-3" aria-label="Task list" role="list">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  onEdit={canEdit(task) ? setEditingTaskId : undefined}
                  onDelete={canEdit(task) ? setDeletingTaskId : undefined}
                  canEdit={canEdit(task)}
                />
              </li>
            ))}
          </ul>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isPending}
                aria-label="Load more tasks"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new task</DialogTitle>
            <DialogDescription>
              Add a new task to your list.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            categories={categories}
            teamId={teamId}
            onSuccess={() => setCreateDialogOpen(false)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingTaskId}
        onOpenChange={(open) => !open && setEditingTaskId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Make changes to your task.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              categories={categories}
              teamId={teamId}
              onSuccess={() => setEditingTaskId(null)}
              onCancel={() => setEditingTaskId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingTaskId}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete task
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingTaskId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
