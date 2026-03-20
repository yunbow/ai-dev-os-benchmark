import { prisma } from "@/lib/prisma";
import { TaskCard } from "./task-card";
import { TaskStatus, Priority } from "@prisma/client";

interface TaskListProps {
  userId: string;
  searchParams: Record<string, string>;
}

export async function TaskList({ userId, searchParams }: TaskListProps) {
  const { status, priority, categoryId, search, sortField = "createdAt", sortDirection = "desc", cursor } =
    searchParams;

  const PAGE_SIZE = 20;

  const where: Record<string, unknown> = {
    OR: [
      { creatorId: userId, teamId: null },
      { assigneeId: userId, teamId: null },
    ],
    ...(status && Object.values(TaskStatus).includes(status as TaskStatus) && { status: status as TaskStatus }),
    ...(priority && Object.values(Priority).includes(priority as Priority) && { priority: priority as Priority }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(cursor && { id: { gt: cursor } }),
  };

  const validSortFields = ["createdAt", "dueDate", "priority"] as const;
  const field = validSortFields.includes(sortField as typeof validSortFields[number])
    ? sortField as typeof validSortFields[number]
    : "createdAt";

  const tasks = await prisma.task.findMany({
    where,
    take: PAGE_SIZE + 1,
    orderBy: { [field]: sortDirection === "asc" ? "asc" : "desc" },
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
      creator: { select: { id: true, name: true, email: true, image: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  });

  const hasMore = tasks.length > PAGE_SIZE;
  const data = hasMore ? tasks.slice(0, PAGE_SIZE) : tasks;
  const nextCursor = hasMore ? data[data.length - 1]?.id : null;

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
        <p className="text-lg font-medium">No tasks found</p>
        <p className="text-sm mt-1">Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-3" role="list" aria-label="Task list">
        {data.map((task) => (
          <li key={task.id}>
            <TaskCard task={task} currentUserId={userId} />
          </li>
        ))}
      </ul>
      {hasMore && nextCursor && (
        <div className="mt-6 text-center">
          <a
            href={`?${new URLSearchParams({ ...searchParams, cursor: nextCursor }).toString()}`}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            Load more
          </a>
        </div>
      )}
    </div>
  );
}
