import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskList } from "@/components/tasks/TaskList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { taskFilterSchema } from "@/lib/validations/task";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Tasks",
};

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const filterResult = taskFilterSchema.safeParse({
    status: params.status,
    priority: params.priority,
    categoryId: params.categoryId,
    assigneeId: params.assigneeId,
    teamId: params.teamId,
    search: params.search,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "desc",
    cursor: params.cursor,
    limit: params.limit ?? 20,
  });

  const filters = filterResult.success ? filterResult.data : {
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    limit: 20,
  };

  const userId = session.user.id;

  // Build where clause
  const where: Record<string, unknown> = {
    OR: [{ creatorId: userId }, { assigneeId: userId }],
  };

  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.teamId) where.teamId = filters.teamId;

  if (filters.search) {
    const search = filters.search;
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  // Build orderBy
  let orderBy: Record<string, string> = { createdAt: filters.sortOrder };
  if (filters.sortBy === "dueDate") {
    orderBy = { dueDate: filters.sortOrder };
  } else if (filters.sortBy === "priority") {
    orderBy = { priority: filters.sortOrder };
  }

  const limit = filters.limit + 1;

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    take: limit,
    cursor: filters.cursor ? { id: filters.cursor } : undefined,
    skip: filters.cursor ? 1 : 0,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      creatorId: true,
      assigneeId: true,
      categoryId: true,
      teamId: true,
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  const hasMore = tasks.length > filters.limit;
  const items = hasMore ? tasks.slice(0, -1) : tasks;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Get categories for filter
  const categories = await prisma.category.findMany({
    where: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
    select: { id: true, name: true, color: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track your tasks</p>
        </div>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Task
          </Link>
        </Button>
      </div>

      <TaskList
        initialTasks={items as Parameters<typeof TaskList>[0]["initialTasks"]}
        nextCursor={nextCursor}
        hasMore={hasMore}
        categories={categories}
        currentFilters={filters}
        currentUserId={userId}
      />
    </div>
  );
}
