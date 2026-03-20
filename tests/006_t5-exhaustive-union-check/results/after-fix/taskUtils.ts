export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case "TODO":
      return "To Do";
    case "IN_PROGRESS":
      return "In Progress";
    case "DONE":
      return "Done";
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
    }
  }
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "TODO":
      return "text-gray-500";
    case "IN_PROGRESS":
      return "text-blue-500";
    case "DONE":
      return "text-green-500";
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
    }
  }
}

export function getPriorityIcon(priority: Priority): string {
  switch (priority) {
    case "LOW":
      return "arrow-down";
    case "MEDIUM":
      return "minus";
    case "HIGH":
      return "arrow-up";
    default: {
      const _exhaustive: never = priority;
      throw new Error(`Unhandled priority: ${_exhaustive}`);
    }
  }
}

export function getNextStatus(status: TaskStatus): TaskStatus {
  switch (status) {
    case "TODO":
      return "IN_PROGRESS";
    case "IN_PROGRESS":
      return "DONE";
    case "DONE":
      return "TODO";
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
    }
  }
}
