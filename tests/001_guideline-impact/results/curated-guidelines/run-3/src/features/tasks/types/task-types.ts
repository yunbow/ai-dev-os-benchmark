import type { Task, Category, User, Team } from "@prisma/client";

export type TaskWithRelations = Task & {
  category: Pick<Category, "id" | "name" | "color"> | null;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  creator: Pick<User, "id" | "name" | "email">;
  team: Pick<Team, "id" | "name"> | null;
};

export type TaskFilters = {
  status?: string;
  priority?: string;
  categoryId?: string;
  assigneeId?: string;
  search?: string;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  teamId?: string;
  limit?: number;
};

export type PaginatedTasks = {
  tasks: TaskWithRelations[];
  hasNextPage: boolean;
  nextCursor?: string;
  total: number;
};
