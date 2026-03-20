"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, Mail, UserMinus, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { inviteTeamMember, removeTeamMember, updateMemberRole, deleteTeam } from "@/actions/teams";
import type { TeamRole } from "@prisma/client";
import Link from "next/link";

interface Member {
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: Member[];
}

interface TeamDetailProps {
  team: Team;
  currentUserId: string;
  currentRole: TeamRole;
}

export function TeamDetail({ team, currentUserId, currentRole }: TeamDetailProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [inviteError, setInviteError] = useState("");

  const isOwner = currentRole === "OWNER";

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setInviteError("");

    startTransition(async () => {
      const result = await inviteTeamMember(team.id, formData);
      if (!result.success) {
        setInviteError(result.error);
      } else {
        toast.success("Invitation sent");
        setInviteOpen(false);
      }
    });
  }

  function handleRemove(userId: string, name: string) {
    const isSelf = userId === currentUserId;
    if (!confirm(isSelf ? "Leave this team?" : `Remove ${name} from the team?`)) return;

    startTransition(async () => {
      const result = await removeTeamMember(team.id, userId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(isSelf ? "You left the team" : "Member removed");
        if (isSelf) router.push("/dashboard/teams");
        else router.refresh();
      }
    });
  }

  function handleRoleChange(userId: string, role: string) {
    const formData = new FormData();
    formData.set("role", role);

    startTransition(async () => {
      const result = await updateMemberRole(team.id, userId, formData);
      if (!result.success) toast.error(result.error);
      else { toast.success("Role updated"); router.refresh(); }
    });
  }

  function handleDeleteTeam() {
    if (!confirm("Delete this team? All tasks and categories will be deleted.")) return;

    startTransition(async () => {
      const result = await deleteTeam(team.id);
      if (!result.success) toast.error(result.error);
      else {
        toast.success("Team deleted");
        router.push("/dashboard/teams");
      }
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/teams">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Teams
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-[var(--color-card)] p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              {team.members.length} member{team.members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>Send an invitation via email.</DialogDescription>
                    </DialogHeader>
                    <form id="invite-form" onSubmit={handleInvite} className="space-y-4" noValidate>
                      {inviteError && <p role="alert" className="text-sm text-[var(--color-destructive)]">{inviteError}</p>}
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input id="invite-email" name="email" type="email" required placeholder="colleague@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Role</Label>
                        <Select name="role" defaultValue="MEMBER">
                          <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="VIEWER">Viewer (read-only)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </form>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                      <Button type="submit" form="invite-form" disabled={isPending}>
                        {isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="destructive" size="sm" onClick={handleDeleteTeam} disabled={isPending}>
                  Delete Team
                </Button>
              </>
            )}
          </div>
        </div>

        <section aria-labelledby="members-heading">
          <h2 id="members-heading" className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            Members
          </h2>
          <ul className="space-y-2" role="list">
            {team.members.map((member) => (
              <li key={member.userId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image ?? undefined} alt={member.user.name ?? ""} />
                    <AvatarFallback className="text-xs">
                      {(member.user.name ?? member.user.email)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.user.name ?? member.user.email}
                      {member.userId === currentUserId && (
                        <span className="ml-1 text-xs text-[var(--color-muted-foreground)]">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={member.role === "OWNER" ? "default" : "secondary"} className="text-xs">
                    {member.role === "OWNER" && <Crown className="mr-1 h-3 w-3" aria-hidden="true" />}
                    {member.role}
                  </Badge>

                  {isOwner && member.userId !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${member.user.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role !== "MEMBER" && (
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "MEMBER")}>
                            Set as Member
                          </DropdownMenuItem>
                        )}
                        {member.role !== "VIEWER" && (
                          <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "VIEWER")}>
                            Set as Viewer
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[var(--color-destructive)]"
                          onClick={() => handleRemove(member.userId, member.user.name ?? member.user.email)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" aria-hidden="true" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {!isOwner && member.userId === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
                      onClick={() => handleRemove(currentUserId, "yourself")}
                      disabled={isPending}
                    >
                      Leave
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
