import { getTeam } from "@/lib/actions/teams";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { MemberList } from "@/components/teams/member-list";
import { InviteForm } from "@/components/teams/invite-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const teamResult = await getTeam(id);

  if (!teamResult.success) {
    notFound();
  }

  const team = teamResult.data;
  const currentMember = team.members.find((m) => m.userId === session.user!.id);
  const isOwnerOrMember =
    currentMember?.role === "OWNER" || currentMember?.role === "MEMBER";

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/teams">← Back to Teams</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-gray-500">{team.members.length} members</p>
        </div>
        {currentMember && (
          <Badge variant="outline">Your role: {currentMember.role}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberList
                members={team.members}
                currentUserId={session.user.id}
                teamId={team.id}
                isOwner={currentMember?.role === "OWNER"}
              />
            </CardContent>
          </Card>
        </div>

        {isOwnerOrMember && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Invite Member</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteForm teamId={team.id} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
