import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { TaskDetail } from "@/features/tasks/components/task-detail";
import { TaskWithRelations } from "@/features/tasks/types/task-types";

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TaskPageProps) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id }, select: { title: true } });
  return { title: task ? `${task.title} - TaskFlow` : "Task - TaskFlow" };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!task) notFound();

  // Check access
  const hasAccess =
    task.creatorId === session.user.id ||
    task.assigneeId === session.user.id ||
    (task.teamId &&
      (await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: task.teamId, userId: session.user.id } },
      })));

  if (!hasAccess) notFound();

  const isOwner = task.creatorId === session.user.id;

  return (
    <div className="mx-auto max-w-2xl">
      <TaskDetail task={task as TaskWithRelations} isOwner={isOwner} />
    </div>
  );
}
