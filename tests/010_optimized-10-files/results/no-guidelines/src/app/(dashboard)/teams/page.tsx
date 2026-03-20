import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TeamsClient } from "./teams-client";

export const metadata: Metadata = {
  title: "Teams",
  description: "Manage your teams",
};

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const teams = await db.team.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
      </div>
      <TeamsClient
        initialTeams={teams}
        currentUserId={userId}
      />
    </div>
  );
}
