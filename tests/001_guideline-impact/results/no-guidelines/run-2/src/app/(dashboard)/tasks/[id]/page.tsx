import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TaskDetail } from "@/components/tasks/task-detail";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id }, select: { title: true } });
  return { title: task ? `${task.title} - TaskFlow` : "Task - TaskFlow" };
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const task = await prisma.task.findUnique({
    where: { id },
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

  if (!task) notFound();

  // Check access
  const hasAccess =
    task.creatorId === userId ||
    task.assigneeId === userId ||
    (task.teamId &&
      !!(await prisma.teamMember.findUnique({
        where: { userId_teamId: { userId, teamId: task.teamId } },
      })));

  if (!hasAccess) notFound();

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ userId }, ...(task.teamId ? [{ teamId: task.teamId }] : [])],
    },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <section aria-labelledby="task-detail-heading">
      <TaskDetail task={task} currentUserId={userId} categories={categories} />
    </section>
  );
}
