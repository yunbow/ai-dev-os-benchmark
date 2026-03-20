"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { removeTeamMember } from "@/lib/actions/teams";
import type { TeamMemberWithRelations } from "@/lib/types";
import { TeamRole } from "@prisma/client";

interface MemberListProps {
  members: TeamMemberWithRelations[];
  currentUserId: string;
  teamId: string;
  isOwner: boolean;
}

const roleVariants: Record<TeamRole, "default" | "secondary" | "outline" | "destructive"> = {
  OWNER: "default",
  MEMBER: "secondary",
  VIEWER: "outline",
};

export function MemberList({ members, currentUserId, teamId, isOwner }: MemberListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (memberId: string, memberName: string) => {
    const isOwnRemoval = members.find((m) => m.id === memberId)?.userId === currentUserId;
    const message = isOwnRemoval
      ? "Are you sure you want to leave this team?"
      : `Remove ${memberName} from this team?`;

    if (!confirm(message)) return;

    setRemovingId(memberId);
    try {
      const result = await removeTeamMember(teamId, memberId);

      if (result.success) {
        toast({
          title: isOwnRemoval ? "Left team" : "Member removed",
        });
        if (isOwnRemoval) {
          router.push("/teams");
        }
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = member.userId === currentUserId;
        const canRemove =
          (isOwner && member.role !== TeamRole.OWNER) || isCurrentUser;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {member.user.name ?? member.user.email}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={roleVariants[member.role]}>{member.role}</Badge>
              {canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() =>
                    handleRemove(
                      member.id,
                      member.user.name ?? member.user.email,
                    )
                  }
                  disabled={removingId === member.id}
                >
                  {removingId === member.id
                    ? "..."
                    : isCurrentUser
                      ? "Leave"
                      : "Remove"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
