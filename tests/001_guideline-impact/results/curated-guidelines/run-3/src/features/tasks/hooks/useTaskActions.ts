"use client";

import { useState, useOptimistic, useTransition } from "react";
import { toast } from "@/hooks/use-toast";
import {
  toggleTaskStatus,
  deleteTask,
} from "../server/task-actions";
import type { TaskWithRelations } from "../types/task-types";
import type { TaskStatus } from "@prisma/client";

export function useTaskActions(initialTasks: TaskWithRelations[]) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, updateOptimistic] = useOptimistic(
    tasks,
    (state: TaskWithRelations[], { id, status }: { id: string; status: TaskStatus }) =>
      state.map((t) => (t.id === id ? { ...t, status } : t))
  );

  const handleToggleStatus = (task: TaskWithRelations, newStatus: TaskStatus) => {
    startTransition(async () => {
      updateOptimistic({ id: task.id, status: newStatus });

      const result = await toggleTaskStatus(task.id, newStatus, task.updatedAt);

      if (!result.success) {
        // Revert optimistic update
        setTasks((prev) => [...prev]);
        toast({
          title: "Failed to update status",
          description: result.error.message,
          variant: "destructive",
        });
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === result.data.id ? result.data : t))
      );
    });
  };

  const handleDeleteTask = async (id: string) => {
    const result = await deleteTask(id);

    if (!result.success) {
      toast({
        title: "Failed to delete task",
        description: result.error.message,
        variant: "destructive",
      });
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast({
      title: "Task deleted",
      variant: "default",
    });
  };

  return {
    tasks: optimisticTasks,
    isPending,
    handleToggleStatus,
    handleDeleteTask,
  };
}
