import { TaskStatus, Priority, TeamRole } from "@prisma/client";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string[]> };

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

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
  assigneeId: string | null;
  categoryId: string | null;
  teamId: string | null;
  creator: { id: string; name: string | null; email: string; image: string | null };
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  category: { id: string; name: string; color: string } | null;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  categoryId?: string;
  assigneeId?: string;
  teamId?: string | null;
  search?: string;
}

export interface TaskSort {
  field: "createdAt" | "dueDate" | "priority";
  direction: "asc" | "desc";
}

export interface TeamWithMembers {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  members: {
    userId: string;
    role: TeamRole;
    joinedAt: Date;
    user: { id: string; name: string | null; email: string; image: string | null };
  }[];
}

export { TaskStatus, Priority, TeamRole };
