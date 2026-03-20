import { Task, TaskStatus, TaskPriority, Category, User, Team } from "@prisma/client";

export type TaskWithRelations = Task & {
  category: Pick<Category, "id" | "name" | "color"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  creator: Pick<User, "id" | "name" | "email">;
  team: Pick<Team, "id" | "name"> | null;
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "secondary",
  IN_PROGRESS: "warning",
  DONE: "success",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "secondary",
  MEDIUM: "warning",
  HIGH: "destructive",
};

export const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
};
