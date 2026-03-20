import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamList } from "@/components/teams/TeamList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Teams",
};

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          ownerId: true,
          _count: { select: { members: true, tasks: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const teams = memberships.map((m) => ({
    ...m.team,
    role: m.role,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Collaborate with your team members</p>
        </div>
        <Button asChild>
          <Link href="/teams/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New Team
          </Link>
        </Button>
      </div>

      <TeamList teams={teams} />
    </div>
  );
}
