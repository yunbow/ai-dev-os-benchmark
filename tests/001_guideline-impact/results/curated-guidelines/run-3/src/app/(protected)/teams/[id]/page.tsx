import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getTeam } from "@/features/teams/server/team-actions";
import { MemberList } from "@/features/teams/components/member-list";
import { InviteFormWrapper } from "./invite-form-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, ClipboardList, UserPlus } from "lucide-react";
import type { TeamRole } from "@prisma/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getTeam(id);
  return {
    title: result.success ? result.data.name : "Team",
  };
}

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const result = await getTeam(id);

  if (!result.success) {
    notFound();
  }

  const team = result.data;
  const currentMember = team.members.find((m) => m.userId === session.user.id);
  const currentUserRole = currentMember?.role as TeamRole;
  const isOwner = currentUserRole === "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {team.members.length} member{team.members.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              {team._count.tasks} task{team._count.tasks !== 1 ? "s" : ""}
            </span>
            {currentUserRole && (
              <Badge variant="secondary">{currentUserRole}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          {isOwner && (
            <InviteFormWrapper teamId={id} />
          )}
        </div>

        <MemberList
          teamId={id}
          members={team.members}
          currentUserId={session.user.id}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  );
}
