import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./categories-client";

export const metadata: Metadata = {
  title: "Categories - TaskFlow",
};

export default async function CategoriesPage() {
  const session = await auth();

  const categories = await prisma.category.findMany({
    where: { userId: session!.user!.id! },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Organize your tasks with color-coded categories
        </p>
      </div>
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
