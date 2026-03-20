import type { User, Task, Category, Team, TeamMember, TaskStatus, TaskPriority, TeamRole } from "@prisma/client";

// Re-export Prisma enums
export { TaskStatus, TaskPriority, TeamRole };

// Action result pattern
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// User types
export type SafeUser = Omit<User, "password">;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null | undefined;
};

// Task with relations
export type TaskWithRelations = Task & {
  creator: Pick<User, "id" | "name" | "email">;
  assignee: Pick<User, "id" | "name" | "email"> | null;
  category: Pick<Category, "id" | "name" | "color"> | null;
  team: Pick<Team, "id" | "name"> | null;
};

// Category types
export type CategoryWithCount = Category & {
  _count: { tasks: number };
};

// Team types
export type TeamWithMembers = Team & {
  members: (TeamMember & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
  _count: { members: number; tasks: number };
};

export type TeamMemberWithUser = TeamMember & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

// Pagination
export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Priority order for sorting
export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
