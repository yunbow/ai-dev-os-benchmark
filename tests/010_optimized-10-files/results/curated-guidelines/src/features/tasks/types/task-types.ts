import type { Task, User, Category, Team } from "@prisma/client";

export type TaskWithRelations = Task & {
  creator: Pick<User, "id" | "name" | "email" | "image">;
  assignee: Pick<User, "id" | "name" | "email" | "image"> | null;
  category: Pick<Category, "id" | "name" | "color"> | null;
  team: Pick<Team, "id" | "name"> | null;
};
