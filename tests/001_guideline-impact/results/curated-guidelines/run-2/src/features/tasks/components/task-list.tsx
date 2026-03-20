"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TaskCard } from "./task-card";
import { TaskWithRelations } from "../types/task-types";
import { useOptimisticTask } from "@/hooks/use-optimistic-task";
import { EmptyState } from "@/components/common/empty-state";
import { CheckSquare } from "lucide-react";
import { TaskStatus } from "@prisma/client";

interface TaskListProps {
  tasks: TaskWithRelations[];
}

export function TaskList({ tasks }: TaskListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { optimisticTasks, handleToggleStatus } = useOptimisticTask(tasks);

  const handleStatusChange = (id: string, status: TaskStatus) => {
    startTransition(async () => {
      await handleToggleStatus(id, status);
      router.refresh();
    });
  };

  if (optimisticTasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks yet"
        description="Create your first task to get started"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {optimisticTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
