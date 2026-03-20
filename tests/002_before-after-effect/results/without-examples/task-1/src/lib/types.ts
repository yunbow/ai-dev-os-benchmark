import { TaskStatus, Priority, TeamRole } from "@prisma/client";

// ActionResult pattern
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown[] } };

// Auth types
export interface AuthResult {
  userId: string;
  email: string;
}

export interface AuthResultWithTask extends AuthResult {
  task: TaskWithRelations;
}

export interface AuthResultWithMembership extends AuthResult {
  membership: TeamMemberWithRelations;
}

// Task types
export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  assigneeId: string | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  teamId: string | null;
}

// Category types
export interface CategoryWithCount {
  id: string;
  name: string;
  color: string;
  userId: string | null;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    tasks: number;
  };
}

// Team types
export interface TeamWithMembers {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  members: TeamMemberWithRelations[];
}

export interface TeamMemberWithRelations {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

// Pagination
export interface PaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Task filter/sort options
export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  categoryId?: string;
  assigneeId?: string;
  search?: string;
  teamId?: string;
}

export type TaskSortField = "createdAt" | "dueDate" | "priority";
export type SortOrder = "asc" | "desc";

export interface TaskSortOptions {
  field: TaskSortField;
  order: SortOrder;
}

// API error format
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

// Session user
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}
