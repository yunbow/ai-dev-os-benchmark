import { prisma } from "@/lib/prisma";
import { TaskCard } from "@/components/tasks/task-card";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import type { TeamRole } from "@prisma/client";

interface TeamTaskListProps {
  teamId: string;
  currentUserId: string;
  currentRole: TeamRole;
  categories: { id: string; name: string; color: string }[];
}

export async function TeamTaskList({ teamId, currentUserId, currentRole, categories }: TeamTaskListProps) {
  const canCreate = currentRole !== "VIEWER";

  const tasks = await prisma.task.findMany({
    where: { teamId },
    take: 20,
    orderBy: { createdAt: "desc" },
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

  return (
    <div>
      {canCreate && (
        <div className="mb-4">
          <CreateTaskButton categories={categories} />
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--color-muted-foreground)]">
          <p className="text-lg font-medium">No tasks yet</p>
          {canCreate && <p className="text-sm mt-1">Create the first task for your team.</p>}
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} currentUserId={currentUserId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
