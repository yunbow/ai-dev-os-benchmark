type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type Priority = "LOW" | "MEDIUM" | "HIGH";

export function getStatusLabel(status: TaskStatus): string {
  if (status === "TODO") return "To Do";
  if (status === "IN_PROGRESS") return "In Progress";
  return "Done";
}

export function getStatusColor(status: TaskStatus): string {
  if (status === "TODO") return "text-gray-500";
  if (status === "IN_PROGRESS") return "text-blue-500";
  return "text-green-500";
}

export function getPriorityIcon(priority: Priority): string {
  if (priority === "LOW") return "arrow-down";
  if (priority === "MEDIUM") return "minus";
  return "arrow-up";
}

export function getNextStatus(status: TaskStatus): TaskStatus {
  if (status === "TODO") return "IN_PROGRESS";
  if (status === "IN_PROGRESS") return "DONE";
  return "TODO";
}
