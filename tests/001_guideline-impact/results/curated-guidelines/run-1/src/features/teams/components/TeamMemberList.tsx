"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMemberRoleAction, removeTeamMemberAction } from "../server/team-actions";
import { TeamMember, TeamRole } from "@prisma/client";

type MemberWithUser = TeamMember & {
  user: { id: string; name: string | null; email: string; image: string | null };
};

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

interface TeamMemberListProps {
  members: MemberWithUser[];
  teamId: string;
  currentUserId: string;
  isOwner: boolean;
  ownerId: string;
}

export function TeamMemberList({
  members,
  teamId,
  currentUserId,
  isOwner,
  ownerId,
}: TeamMemberListProps) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(memberId: string, role: TeamRole) {
    startTransition(async () => {
      const result = await updateMemberRoleAction(teamId, memberId, { role });
      if (!result.success) toast.error(result.error.message);
      else toast.success("Role updated");
    });
  }

  function handleRemove(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the team?`)) return;
    startTransition(async () => {
      const result = await removeTeamMemberAction(teamId, memberId);
      if (!result.success) toast.error(result.error.message);
      else toast.success("Member removed");
    });
  }

  return (
    <ul className="space-y-2" aria-label="Team members">
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const isTeamOwner = member.userId === ownerId;
        const initials = member.user.name
          ? member.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : member.user.email[0].toUpperCase();

        return (
          <li key={member.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={member.user.image ?? undefined} alt={member.user.name ?? ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium leading-tight">
                {member.user.name ?? member.user.email}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </p>
              {member.user.name && (
                <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
              )}
            </div>

            {isOwner && !isTeamOwner ? (
              <Select
                defaultValue={member.role}
                onValueChange={(v) => handleRoleChange(member.id, v as TeamRole)}
                disabled={isPending}
              >
                <SelectTrigger className="w-28" aria-label={`Role for ${member.user.name ?? member.user.email}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["OWNER", "MEMBER", "VIEWER"] as TeamRole[]).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
            )}

            {isOwner && !isTeamOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(member.id, member.user.name ?? member.user.email)}
                disabled={isPending}
                aria-label={`Remove ${member.user.name ?? member.user.email}`}
              >
                Remove
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
