import Link from "next/link";
import { TaskForm } from "@/components/forms/task-form";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewTaskPage() {
  const session = await getSession();
  if (!session) return null;

  // Fetch user's teams for the team selector
  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    select: { id: true, name: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link href="/tasks" className="text-sm text-gray-500 hover:text-gray-700">
          Tasks
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-900">New task</span>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Create new task</h1>
        <TaskForm teams={teams} />
      </div>
    </div>
  );
}
