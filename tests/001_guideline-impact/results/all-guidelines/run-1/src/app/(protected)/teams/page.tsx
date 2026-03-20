import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamsClient } from "./teams-client";

export const metadata: Metadata = {
  title: "Teams - TaskFlow",
};

export default async function TeamsPage() {
  const session = await auth();

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session!.user!.id! },
    include: {
      team: {
        include: {
          _count: { select: { members: true, tasks: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const teams = memberships.map((m: typeof memberships[number]) => ({
    ...m.team,
    role: m.role,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">
          Collaborate with your teammates
        </p>
      </div>
      <TeamsClient initialTeams={teams} />
    </div>
  );
}
