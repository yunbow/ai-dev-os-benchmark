import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { TeamList } from "@/features/teams/components/team-list";
import { TeamWithMembers } from "@/features/teams/types/team-types";

export const metadata = {
  title: "Teams - TaskFlow",
};

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Teams</h1>
      <TeamList teams={teams as TeamWithMembers[]} currentUserId={session.user.id} />
    </div>
  );
}
