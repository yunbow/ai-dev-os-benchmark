import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getTeamWithMembers,
  assertTeamMembership,
} from "@/features/team/services/team-service";
import { TeamInviteForm } from "@/features/team/components/TeamInviteForm";
import { formatDate } from "@/lib/utils";
import { Crown, Users, Eye, Mail } from "lucide-react";
import { TeamRole } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeamWithMembers(id);
  return { title: team?.name ?? "Team" };
}

const roleConfig: Record<
  TeamRole,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" }
> = {
  OWNER: {
    label: "Owner",
    icon: <Crown className="h-3 w-3" />,
    variant: "default",
  },
  MEMBER: {
    label: "Member",
    icon: <Users className="h-3 w-3" />,
    variant: "secondary",
  },
  VIEWER: {
    label: "Viewer",
    icon: <Eye className="h-3 w-3" />,
    variant: "outline",
  },
};

export default async function TeamPage({ params }: TeamPageProps) {
  const { id: teamId } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();

  const { allowed, role: userRole } = await assertTeamMembership(
    teamId,
    session.user.id
  );

  if (!allowed) notFound();

  const team = await getTeamWithMembers(teamId);
  if (!team) notFound();

  const isOwner = userRole === TeamRole.OWNER;

  return (
    <div className="flex flex-col overflow-hidden">
      <Header title={team.name} />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{team.name}</h2>
              <p className="text-sm text-muted-foreground">
                {team._count.members} members · {team._count.tasks} tasks
              </p>
            </div>

            {isOwner && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Mail className="h-4 w-4" />
                    Invite member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite a new member</DialogTitle>
                  </DialogHeader>
                  <div className="pt-2">
                    <TeamInviteForm teamId={teamId} />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="rounded-lg border bg-card">
            <div className="border-b p-4">
              <h3 className="font-semibold">Members</h3>
            </div>
            <div className="divide-y">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {member.user.name?.[0]?.toUpperCase() ??
                        member.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user.name ?? member.user.email}
                      </p>
                      {member.user.name && (
                        <p className="text-xs text-muted-foreground">
                          {member.user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={roleConfig[member.role].variant}
                      className="gap-1"
                    >
                      {roleConfig[member.role].icon}
                      {roleConfig[member.role].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      Joined {formatDate(member.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
