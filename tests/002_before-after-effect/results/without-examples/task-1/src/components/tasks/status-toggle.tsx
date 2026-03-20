"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { toggleTaskStatus } from "@/lib/actions/tasks";
import type { TaskWithRelations } from "@/lib/types";
import { TaskStatus } from "@prisma/client";

interface StatusToggleProps {
  task: TaskWithRelations;
}

const statusFlow: Record<TaskStatus, TaskStatus> = {
  [TaskStatus.TODO]: TaskStatus.IN_PROGRESS,
  [TaskStatus.IN_PROGRESS]: TaskStatus.DONE,
  [TaskStatus.DONE]: TaskStatus.TODO,
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

const statusVariants: Record<
  TaskStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  [TaskStatus.TODO]: "secondary",
  [TaskStatus.IN_PROGRESS]: "default",
  [TaskStatus.DONE]: "outline",
};

export function StatusToggle({ task }: StatusToggleProps) {
  const [currentTask, setCurrentTask] = useState(task);
  // Optimistic UI: show next state immediately
  const [optimisticStatus, setOptimisticStatus] = useState(task.status);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggle = () => {
    const nextStatus = statusFlow[optimisticStatus];
    // Optimistic update
    setOptimisticStatus(nextStatus);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("status", nextStatus);
      formData.set("updatedAt", currentTask.updatedAt.toISOString());

      const result = await toggleTaskStatus(currentTask.id, formData);

      if (result.success) {
        setCurrentTask(result.data);
        setOptimisticStatus(result.data.status);
      } else {
        // Revert optimistic update
        setOptimisticStatus(currentTask.status);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            result.error.code === "CONFLICT"
              ? "Task was modified by someone else. Please refresh."
              : result.error.message,
        });
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-2 p-0 h-auto"
      title={`Click to change to ${statusLabels[statusFlow[optimisticStatus]]}`}
    >
      <Badge
        variant={statusVariants[optimisticStatus]}
        className={isPending ? "opacity-70" : ""}
      >
        {statusLabels[optimisticStatus]}
      </Badge>
    </Button>
  );
}
