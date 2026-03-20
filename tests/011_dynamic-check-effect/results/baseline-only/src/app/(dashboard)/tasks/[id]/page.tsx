import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TaskDetail } from "./TaskDetail";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TaskDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: task?.title ?? "Task" };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;
  const userId = session.user.id;

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
      creator: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true, color: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    notFound();
  }

  // Check access: creator, assignee, or team member
  let hasAccess = task.creatorId === userId || task.assigneeId === userId;
  if (!hasAccess && task.teamId) {
    const membership = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId: task.teamId } },
    });
    hasAccess = membership !== null;
  }

  if (!hasAccess) {
    notFound();
  }

  const canEdit = task.creatorId === userId;

  const [categories, teams] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { userId, role: { in: ["OWNER", "MEMBER"] } },
      include: { team: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/tasks"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Back to Tasks
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
      </div>
      <TaskDetail
        task={task as Parameters<typeof TaskDetail>[0]["task"]}
        canEdit={canEdit}
        currentUserId={userId}
        categories={categories}
        teams={teams.map((m) => m.team)}
      />
    </div>
  );
}
