import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

const roleColors = {
  OWNER: "default",
  MEMBER: "secondary",
  VIEWER: "outline",
} as const;

export default async function TeamsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const memberships = await db.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <Button asChild>
          <Link href="/teams/new">Create Team</Link>
        </Button>
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create a team or ask someone to invite you."
          actionLabel="Create team"
          actionHref="/teams/new"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {memberships.map(({ team, role }) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{team.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {team._count.members} {team._count.members === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <Badge variant={roleColors[role]}>{role}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
