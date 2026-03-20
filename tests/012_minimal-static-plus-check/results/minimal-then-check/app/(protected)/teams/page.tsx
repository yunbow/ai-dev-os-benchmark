import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { TeamsView } from "@/features/teams/components/teams-view";

export const metadata = { title: "Teams - TaskFlow" };

export default async function TeamsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
      <TeamsView initialTeams={teams} currentUserId={userId} />
    </div>
  );
}
