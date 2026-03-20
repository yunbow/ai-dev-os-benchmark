"use client";

import { useState, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckSquare, Square } from "lucide-react";
import { updateTaskStatusAction } from "../server/task-actions";
import { Task, TaskStatus } from "@prisma/client";

export function TaskStatusToggle({ task }: { task: Pick<Task, "id" | "status" | "updatedAt"> }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);

  function toggle() {
    const nextStatus =
      optimisticStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;

    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      const result = await updateTaskStatusAction(task.id, {
        status: nextStatus,
        updatedAt: task.updatedAt,
      });
      if (!result.success) {
        toast.error(result.error.message);
      }
    });
  }

  const isDone = optimisticStatus === TaskStatus.DONE;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={isDone}
      aria-label={isDone ? "Mark as not done" : "Mark as done"}
    >
      {isDone ? (
        <CheckSquare className="mr-1 h-4 w-4 text-primary" aria-hidden />
      ) : (
        <Square className="mr-1 h-4 w-4" aria-hidden />
      )}
      {isDone ? "Done" : "Mark done"}
    </Button>
  );
}
