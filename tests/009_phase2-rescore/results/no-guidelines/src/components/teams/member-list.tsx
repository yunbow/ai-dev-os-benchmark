"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { removeMemberAction } from "@/actions/teams";
import { toast } from "@/hooks/use-toast";
import { UserX } from "lucide-react";
import { TeamRole } from "@prisma/client";

interface Member {
  userId: string;
  role: TeamRole;
  user: { id: string; name?: string | null; email: string };
}

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const ROLE_VARIANTS: Record<TeamRole, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  MEMBER: "secondary",
  VIEWER: "outline",
};

export function MemberList({
  members,
  teamId,
  currentUserId,
  isOwner,
}: {
  members: Member[];
  teamId: string;
  currentUserId: string;
  isOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(userId: string) {
    startTransition(async () => {
      const result = await removeMemberAction(teamId, userId);
      if (!result.success) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Member removed" });
      }
    });
  }

  return (
    <ul className="space-y-2" aria-label="Team members">
      {members.map((member) => (
        <li
          key={member.userId}
          className="flex items-center justify-between gap-3 py-2 px-3 rounded-md border bg-card"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {(member.user.name ?? member.user.email)[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {member.user.name ?? member.user.email}
              </p>
              {member.user.name && (
                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={ROLE_VARIANTS[member.role]} className="text-xs">
              {ROLE_LABELS[member.role]}
            </Badge>
            {isOwner && member.userId !== currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(member.userId)}
                disabled={isPending}
                aria-label={`Remove ${member.user.name ?? member.user.email}`}
              >
                <UserX className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
