"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { removeMember, updateMemberRole } from "@/lib/actions/team";
import { useRouter } from "next/navigation";
import type { TeamRole } from "@prisma/client";

interface Member {
  id: string;
  role: TeamRole;
  joinedAt: Date;
  user: { id: string; name: string | null; email: string };
}

interface MemberListProps {
  members: Member[];
  teamId: string;
  isOwner: boolean;
  currentUserId: string;
}

const roleColors = {
  OWNER: "default",
  MEMBER: "secondary",
  VIEWER: "outline",
} as const;

export function MemberList({ members, teamId, isOwner, currentUserId }: MemberListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRemove(userId: string) {
    startTransition(async () => {
      const result = await removeMember(teamId, userId);
      if (result.success) {
        toast({ title: "Member removed" });
        router.refresh();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <ul className="divide-y divide-gray-100" role="list" aria-label="Team members">
      {members.map((member) => (
        <li key={member.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm"
              aria-hidden="true"
            >
              {(member.user.name ?? member.user.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {member.user.name ?? member.user.email}
                {member.user.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </p>
              <p className="text-xs text-gray-500">{member.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={roleColors[member.role]}>{member.role}</Badge>
            {isOwner && member.role !== "OWNER" && (
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    Remove
                  </Button>
                }
                title="Remove member"
                description={`Remove ${member.user.name ?? member.user.email} from the team?`}
                confirmLabel="Remove"
                onConfirm={() => handleRemove(member.user.id)}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
