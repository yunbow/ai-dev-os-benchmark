"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, UserPlus, Trash2, Crown, User, Eye } from "lucide-react";
import { teamSchema, inviteMemberSchema, type TeamInput, type InviteMemberInput } from "@/lib/validations";
import {
  createTeam,
  deleteTeam,
  inviteTeamMember,
  removeTeamMember,
} from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import type { TeamRole } from "@prisma/client";

interface TeamMember {
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: Date | string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date | string;
  owner: { id: string; name: string | null; email: string; image: string | null };
  members: TeamMember[];
  _count: { tasks: number };
}

interface TeamsClientProps {
  initialTeams: Team[];
  currentUserId: string;
}

const roleIcons: Record<TeamRole, React.ComponentType<{ className?: string }>> = {
  OWNER: Crown,
  MEMBER: User,
  VIEWER: Eye,
};

const roleBadgeClass: Record<TeamRole, string> = {
  OWNER: "bg-yellow-50 text-yellow-700 border-yellow-200",
  MEMBER: "bg-blue-50 text-blue-700 border-blue-200",
  VIEWER: "bg-gray-50 text-gray-700 border-gray-200",
};

export function TeamsClient({ initialTeams, currentUserId }: TeamsClientProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [invitingTeam, setInvitingTeam] = useState<Team | null>(null);
  const [isPending, startTransition] = useTransition();

  const createForm = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
  });

  const inviteForm = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
  });

  function handleCreateTeam(data: TeamInput) {
    startTransition(async () => {
      const result = await createTeam(data);
      if (!result.success) {
        toast({
          title: "Failed to create team",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setTeams((prev) => [result.data! as Team, ...prev]);
      setShowCreateForm(false);
      createForm.reset();
      toast({ title: "Team created" });
    });
  }

  function handleDeleteTeam(teamId: string) {
    startTransition(async () => {
      const result = await deleteTeam(teamId);
      if (!result.success) {
        toast({
          title: "Failed to delete team",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      toast({ title: "Team deleted" });
    });
  }

  function handleInviteMember(data: InviteMemberInput) {
    if (!invitingTeam) return;
    startTransition(async () => {
      const result = await inviteTeamMember(invitingTeam.id, data);
      if (!result.success) {
        toast({
          title: "Failed to send invitation",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setInvitingTeam(null);
      inviteForm.reset();
      toast({ title: "Invitation sent", description: `Invitation sent to ${data.email}` });
    });
  }

  function handleRemoveMember(teamId: string, userId: string) {
    startTransition(async () => {
      const result = await removeTeamMember(teamId, userId);
      if (!result.success) {
        toast({
          title: "Failed to remove member",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? { ...t, members: t.members.filter((m) => m.userId !== userId) }
            : t
        )
      );
      toast({ title: "Member removed" });
    });
  }

  return (
    <div className="space-y-4">
      {/* Create team */}
      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={createForm.handleSubmit(handleCreateTeam)}
              noValidate
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label htmlFor="team-name">
                  Team Name <span aria-hidden="true" className="text-destructive">*</span>
                </Label>
                <Input
                  id="team-name"
                  {...createForm.register("name")}
                  placeholder="e.g., Engineering, Marketing"
                  aria-describedby={createForm.formState.errors.name ? "team-name-error" : undefined}
                  aria-invalid={!!createForm.formState.errors.name}
                  aria-required="true"
                  disabled={isPending}
                />
                {createForm.formState.errors.name && (
                  <p id="team-name-error" className="text-xs text-destructive" role="alert">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Team"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    createForm.reset();
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          New Team
        </Button>
      )}

      {/* Teams list */}
      {teams.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm">No teams yet. Create one to collaborate!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const currentMember = team.members.find(
              (m) => m.userId === currentUserId
            );
            const isOwner = team.ownerId === currentUserId;
            const canManage =
              currentMember?.role === "OWNER" ||
              currentMember?.role === "MEMBER";

            return (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {team.members.length} member
                        {team.members.length !== 1 ? "s" : ""} &middot;{" "}
                        {team._count.tasks} task
                        {team._count.tasks !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInvitingTeam(team)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                          Invite
                        </Button>
                      )}
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTeam(team.id)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete team ${team.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Separator className="mb-4" />
                  <h3 className="text-sm font-medium mb-3">Members</h3>
                  <ul className="space-y-2" aria-label={`Members of ${team.name}`}>
                    {team.members.map((member) => {
                      const RoleIcon = roleIcons[member.role];
                      return (
                        <li
                          key={member.userId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={member.user.image ?? undefined}
                                alt={member.user.name ?? member.user.email}
                              />
                              <AvatarFallback className="text-xs">
                                {(member.user.name ?? member.user.email)[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
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
                              variant="outline"
                              className={roleBadgeClass[member.role]}
                            >
                              <RoleIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                              {member.role}
                            </Badge>
                            {isOwner &&
                              member.userId !== currentUserId && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    handleRemoveMember(team.id, member.userId)
                                  }
                                  disabled={isPending}
                                  aria-label={`Remove ${member.user.name ?? member.user.email} from team`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                </Button>
                              )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite member dialog */}
      <Dialog
        open={!!invitingTeam}
        onOpenChange={(open) => {
          if (!open) {
            setInvitingTeam(null);
            inviteForm.reset();
          }
        }}
      >
        <DialogContent aria-labelledby="invite-dialog-title">
          <DialogHeader>
            <DialogTitle id="invite-dialog-title">
              Invite to {invitingTeam?.name}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={inviteForm.handleSubmit(handleInviteMember)}
            noValidate
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="invite-email">
                Email Address <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                {...inviteForm.register("email")}
                placeholder="colleague@example.com"
                autoComplete="email"
                aria-describedby={inviteForm.formState.errors.email ? "invite-email-error" : undefined}
                aria-invalid={!!inviteForm.formState.errors.email}
                aria-required="true"
                disabled={isPending}
              />
              {inviteForm.formState.errors.email && (
                <p id="invite-email-error" className="text-xs text-destructive" role="alert">
                  {inviteForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              An invitation email will be sent. The link expires in 7 days.
            </p>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Sending..." : "Send Invitation"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInvitingTeam(null);
                  inviteForm.reset();
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
