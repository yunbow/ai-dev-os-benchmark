"use client";

import { useOptimistic, useCallback } from "react";
import { TaskStatus } from "@prisma/client";
import { toggleTaskStatus } from "@/features/tasks/server/task-actions";
import { toast } from "@/components/ui/use-toast";

interface TaskWithStatus {
  id: string;
  status: TaskStatus;
}

export function useOptimisticTask<T extends TaskWithStatus>(tasks: T[]) {
  const [optimisticTasks, updateOptimistic] = useOptimistic(
    tasks,
    (state: T[], { id, status }: { id: string; status: TaskStatus }) =>
      state.map((task) => (task.id === id ? { ...task, status } : task))
  );

  const handleToggleStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      updateOptimistic({ id: taskId, status: newStatus });

      const result = await toggleTaskStatus(taskId, newStatus);

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    [updateOptimistic]
  );

  return { optimisticTasks, handleToggleStatus };
}
