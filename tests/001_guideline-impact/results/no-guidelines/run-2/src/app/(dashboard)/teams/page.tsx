import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TeamsList } from "@/components/teams/teams-list";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Teams - TaskFlow" };

export default async function TeamsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          createdAt: true,
          _count: { select: { members: true, tasks: true } },
        },
      },
    },
  });

  const teams = memberships.map((m) => ({
    ...m.team,
    role: m.role,
  }));

  return (
    <section aria-labelledby="teams-heading">
      <div className="mb-6">
        <h1 id="teams-heading" className="text-2xl font-bold">Teams</h1>
        <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
          Collaborate with your teammates on shared tasks.
        </p>
      </div>
      <TeamsList initialTeams={teams} currentUserId={userId} />
    </section>
  );
}
