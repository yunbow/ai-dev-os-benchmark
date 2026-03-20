"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTeamAction, deleteTeamAction } from "@/features/teams/server/team-actions";
import { TeamMemberList } from "@/features/teams/components/team-member-list";
import { InviteMemberForm } from "@/features/teams/components/invite-member-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Team, TeamMember, TeamRole, User } from "@prisma/client";

type TeamWithDetails = Team & {
  members: (TeamMember & { user: Pick<User, "id" | "name" | "email" | "image"> })[];
  _count: { tasks: number };
};

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [team, setTeam] = useState<TeamWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const fetchTeam = useCallback(async () => {
    const result = await getTeamAction(params.id);
    if (result.success) {
      setTeam(result.data.team as TeamWithDetails);
      setCurrentUserId(result.data.currentUserId);
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      router.push("/teams");
    }
    setLoading(false);
  }, [params.id, router, toast]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleDelete = async () => {
    if (!team) return;
    const result = await deleteTeamAction(team.id);
    if (result.success) {
      toast({ title: "Team deleted" });
      router.push("/teams");
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!team) return null;

  const currentMember = team.members.find((m) => m.user.id === currentUserId);
  const currentUserRole = (currentMember?.role ?? "VIEWER") as TeamRole;
  const canManage = currentUserRole === "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">{team.name}</h1>
        <div className="flex gap-2">
          {canManage && (
            <>
              <Button variant="outline" onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Team
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{team.members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{team._count?.tasks ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{currentUserRole.toLowerCase()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamMemberList
            teamId={team.id}
            members={team.members}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onChanged={fetchTeam}
          />
        </CardContent>
      </Card>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <InviteMemberForm
            teamId={team.id}
            onSuccess={() => {
              setShowInviteDialog(false);
              fetchTeam();
            }}
            onCancel={() => setShowInviteDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
