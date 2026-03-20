import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import * as teamService from "@/lib/services/team.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteMemberForm } from "@/components/teams/invite-member-form";
import { MemberList } from "@/components/teams/member-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const roleColors = {
  OWNER: "default",
  MEMBER: "secondary",
  VIEWER: "outline",
} as const;

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  let team;
  try {
    team = await teamService.getTeamById(id, userId);
  } catch {
    notFound();
  }

  const currentMember = team.members.find((m) => m.user.id === userId);
  const isOwner = currentMember?.role === "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Back to teams
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
        {currentMember && (
          <Badge variant={roleColors[currentMember.role]}>{currentMember.role}</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Members ({team.members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberList members={team.members} teamId={id} isOwner={isOwner} currentUserId={userId} />
            </CardContent>
          </Card>
        </div>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteMemberForm teamId={id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
