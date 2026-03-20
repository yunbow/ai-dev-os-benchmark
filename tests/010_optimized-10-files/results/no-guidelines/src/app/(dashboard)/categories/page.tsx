import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoriesClient } from "./categories-client";

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage your task categories",
};

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const categories = await db.category.findMany({
    where: {
      OR: [
        { userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    include: {
      _count: { select: { tasks: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
      </div>
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
