import { TaskStatus, TaskPriority, TeamRole } from "@prisma/client";

export type { TaskStatus, TaskPriority, TeamRole };

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  assigneeId?: string;
  teamId?: string;
  search?: string;
  cursor?: string;
}

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  creatorId: string;
  assigneeId: string | null;
  categoryId: string | null;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; name: string | null; email: string };
  assignee: { id: string; name: string | null; email: string } | null;
  category: { id: string; name: string; color: string } | null;
}

export interface TeamWithMembers {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  members: Array<{
    id: string;
    role: TeamRole;
    joinedAt: Date;
    user: { id: string; name: string | null; email: string };
  }>;
}
