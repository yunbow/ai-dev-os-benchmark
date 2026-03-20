import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { TaskForm } from "@/features/task/components/TaskForm";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "New Task" };

export default async function NewTaskPage() {
  const session = await auth();
  const categories = session?.user?.id
    ? await prisma.category.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col overflow-hidden">
      <Header title="New Task" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-xl">
          <div className="mb-4">
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/tasks">
                <ArrowLeft className="h-4 w-4" />
                Back to Tasks
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <TaskForm categories={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
