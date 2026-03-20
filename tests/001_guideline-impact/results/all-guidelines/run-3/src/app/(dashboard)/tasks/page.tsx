import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TasksClient from "@/features/tasks/components/TasksClient";

export const metadata: Metadata = {
  title: "Tasks - TaskFlow",
};

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id, teamId: null },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
      <TasksClient initialCategories={categories} />
    </div>
  );
}
