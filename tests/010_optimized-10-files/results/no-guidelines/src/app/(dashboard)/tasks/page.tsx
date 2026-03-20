import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TasksClient } from "./tasks-client";
import TasksLoading from "./loading";
import type { TaskStatus, TaskPriority } from "@prisma/client";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Manage your tasks",
};

interface TasksPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    categoryId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    cursor?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const status = params.status as TaskStatus | undefined;
  const priority = params.priority as TaskPriority | undefined;
  const categoryId = params.categoryId;
  const search = params.search;
  const sortBy = params.sortBy ?? "createdAt";
  const sortOrder = (params.sortOrder ?? "desc") as "asc" | "desc";
  const cursor = params.cursor;

  const validStatuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

  const whereFilter = {
    OR: [
      { creatorId: userId },
      { assigneeId: userId },
      { team: { members: { some: { userId } } } },
    ] as const,
    ...(status && validStatuses.includes(status) ? { status } : {}),
    ...(priority && validPriorities.includes(priority) ? { priority } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderByMap: Record<string, object> = {
    createdAt: { createdAt: sortOrder },
    dueDate: { dueDate: sortOrder },
    priority: { priority: sortOrder },
    title: { title: sortOrder },
  };

  const orderBy = orderByMap[sortBy] ?? { createdAt: sortOrder };

  const [tasks, categories] = await Promise.all([
    db.task.findMany({
      where: whereFilter,
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy,
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        creator: { select: { id: true, name: true, email: true, image: true } },
        team: { select: { id: true, name: true } },
      },
    }),
    db.category.findMany({
      where: {
        OR: [
          { userId },
          { team: { members: { some: { userId } } } },
        ],
      },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasMore = tasks.length > PAGE_SIZE;
  const taskData = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks;
  const nextCursor = hasMore ? taskData[taskData.length - 1]?.id : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Task
          </Link>
        </Button>
      </div>

      <Suspense fallback={<TasksLoading />}>
        <TasksClient
          initialTasks={taskData}
          categories={categories}
          nextCursor={nextCursor}
          hasMore={hasMore}
          filters={{ status, priority, categoryId, search, sortBy, sortOrder }}
        />
      </Suspense>
    </div>
  );
}
