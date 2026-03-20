import { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TasksClient } from "./tasks-client";

export const metadata: Metadata = {
  title: "Tasks - TaskFlow",
};

async function getInitialData(userId: string) {
  const [tasks, categories] = await Promise.all([
    prisma.task.findMany({
      where: { creatorId: userId, teamId: null },
      include: {
        category: { select: { id: true, name: true, color: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return { tasks, categories };
}

function TasksLoadingSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading tasks">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-lg border bg-muted"
        />
      ))}
    </div>
  );
}

async function TasksContent() {
  const session = await auth();
  const { tasks, categories } = await getInitialData(session!.user!.id!);

  return (
    <TasksClient
      initialTasks={tasks as Parameters<typeof TasksClient>[0]["initialTasks"]}
      categories={categories}
    />
  );
}

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">Manage your personal tasks</p>
      </div>

      <Suspense fallback={<TasksLoadingSkeleton />}>
        <TasksContent />
      </Suspense>
    </div>
  );
}
