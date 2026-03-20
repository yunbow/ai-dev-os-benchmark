"use client";

import { TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Check, Circle, Clock } from "lucide-react";
import { TaskWithRelations, NEXT_STATUS } from "../types/task-types";

interface TaskStatusToggleProps {
  task: TaskWithRelations;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

const statusIcons = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: Check,
};

const statusStyles = {
  TODO: "text-gray-400 hover:text-blue-500",
  IN_PROGRESS: "text-blue-500 hover:text-green-500",
  DONE: "text-green-500 hover:text-gray-400",
};

export function TaskStatusToggle({ task, onStatusChange }: TaskStatusToggleProps) {
  const Icon = statusIcons[task.status];
  const nextStatus = NEXT_STATUS[task.status];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStatusChange?.(task.id, nextStatus);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 shrink-0 ${statusStyles[task.status]}`}
      onClick={handleClick}
      title={`Mark as ${nextStatus.replace("_", " ")}`}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}
