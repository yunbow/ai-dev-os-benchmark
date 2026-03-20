import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskForm } from "@/components/tasks/TaskForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "New Task",
};

export default async function NewTaskPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const [categories, teams] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId }, { team: { members: { some: { userId } } } }] },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { userId, role: { in: ["OWNER", "MEMBER"] } },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
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
        <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
      </div>
      <TaskForm
        categories={categories}
        teams={teams.map((m) => m.team)}
        currentUserId={userId}
      />
    </div>
  );
}
