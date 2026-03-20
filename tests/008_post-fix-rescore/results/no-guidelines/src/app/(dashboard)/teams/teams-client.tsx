"use client";

import React, { useState } from "react";
import { deleteTeam } from "@/actions/team-actions";
import { TeamForm } from "@/components/teams/team-form";
import { InviteMemberForm } from "@/components/teams/invite-member-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Plus,
  Users,
  Settings,
  Trash2,
  UserPlus,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { Team } from "@prisma/client";

type TeamWithCount = Team & {
  _count: { members: number };
};

interface TeamsClientProps {
  initialTeams: TeamWithCount[];
  currentUserId: string;
}

export function TeamsClient({ initialTeams, currentUserId }: TeamsClientProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithCount | null>(null);
  const [invitingTeam, setInvitingTeam] = useState<TeamWithCount | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deletingTeamId) return;
    setIsDeleting(true);
    try {
      const result = await deleteTeam(deletingTeamId);
      if (result.success) {
        toast({
          variant: "success",
          title: "Team deleted",
          description: "Team has been deleted successfully.",
        });
        setDeletingTeamId(null);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {initialTeams.length} {initialTeams.length === 1 ? "team" : "teams"}
        </p>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          size="sm"
          aria-label="Create new team"
        >
          <Plus className="mr-2 h-4 w-4" />
          New team
        </Button>
      </div>

      {initialTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">No teams yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a team to collaborate with others.
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="mt-4"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create team
          </Button>
        </div>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Teams"
        >
          {initialTeams.map((team) => {
            const isOwner = team.ownerId === currentUserId;
            return (
              <li key={team.id}>
                <Card className="flex h-full flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{team.name}</CardTitle>
                        {team.description && (
                          <CardDescription className="line-clamp-2">
                            {team.description}
                          </CardDescription>
                        )}
                      </div>
                      {isOwner && (
                        <Badge variant="outline" className="text-xs shrink-0 ml-2">
                          Owner
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {team._count.members}{" "}
                        {team._count.members === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvitingTeam(team)}
                      className="flex-1"
                      aria-label={`Invite member to ${team.name}`}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                    {isOwner && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTeam(team)}
                          aria-label={`Edit ${team.name}`}
                        >
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Settings</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingTeamId(team.id)}
                          aria-label={`Delete ${team.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new team</DialogTitle>
            <DialogDescription>
              Create a team to collaborate with others.
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            onSuccess={() => setCreateDialogOpen(false)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit team</DialogTitle>
            <DialogDescription>
              Update your team&apos;s settings.
            </DialogDescription>
          </DialogHeader>
          {editingTeam && (
            <TeamForm
              team={editingTeam}
              onSuccess={() => setEditingTeam(null)}
              onCancel={() => setEditingTeam(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog
        open={!!invitingTeam}
        onOpenChange={(open) => !open && setInvitingTeam(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Send an invitation to{" "}
              {invitingTeam?.name ? (
                <strong>{invitingTeam.name}</strong>
              ) : (
                "your team"
              )}
              .
            </DialogDescription>
          </DialogHeader>
          {invitingTeam && (
            <InviteMemberForm
              teamId={invitingTeam.id}
              isOwner={invitingTeam.ownerId === currentUserId}
              onSuccess={() => setInvitingTeam(null)}
              onCancel={() => setInvitingTeam(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingTeamId}
        onOpenChange={(open) => !open && setDeletingTeamId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete team
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team? All team tasks,
              categories, and member assignments will be permanently deleted.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingTeamId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
