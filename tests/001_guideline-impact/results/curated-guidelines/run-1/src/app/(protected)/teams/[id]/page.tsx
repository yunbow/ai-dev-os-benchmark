import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/lib/auth/auth";
import { listTeamMembersAction } from "@/features/teams/server/team-actions";
import { TeamMemberList } from "@/features/teams/components/TeamMemberList";
import { InviteMemberButton } from "@/features/teams/components/InviteMemberButton";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session) notFound();

  const [team, membersResult] = await Promise.all([
    prisma.team.findUnique({ where: { id } }),
    listTeamMembersAction(id),
  ]);

  if (!team || !membersResult.success) notFound();

  const members = membersResult.data;
  const currentMember = members.find((m) => m.userId === session.user.id);
  if (!currentMember) notFound();

  const isOwner = currentMember.role === "OWNER";

  return (
    <section aria-labelledby="team-heading">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 id="team-heading" className="text-2xl font-bold">{team.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        {isOwner && <InviteMemberButton teamId={team.id} />}
      </div>

      <TeamMemberList
        members={members}
        teamId={team.id}
        currentUserId={session.user.id}
        isOwner={isOwner}
        ownerId={team.ownerId}
      />
    </section>
  );
}
