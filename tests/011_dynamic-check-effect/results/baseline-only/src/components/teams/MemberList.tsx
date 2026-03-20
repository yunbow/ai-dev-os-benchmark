"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { removeMemberAction, updateMemberRoleAction } from "@/actions/team";
import type { TeamMemberWithUser } from "@/types";
import { TeamRole } from "@prisma/client";
import { UserMinus } from "lucide-react";

interface MemberListProps {
  members: TeamMemberWithUser[];
  teamId: string;
  currentUserId: string;
  isOwner: boolean;
}

const roleColors: Record<TeamRole, string> = {
  OWNER: "text-purple-600 bg-purple-50",
  MEMBER: "text-blue-600 bg-blue-50",
  VIEWER: "text-gray-600 bg-gray-50",
};

export function MemberList({ members, teamId, currentUserId, isOwner }: MemberListProps) {
  const { toast } = useToast();
  const [memberList, setMemberList] = useState(members);

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the team?`)) return;
    const result = await removeMemberAction(teamId, userId);
    if (result.success) {
      setMemberList((prev) => prev.filter((m) => m.userId !== userId));
      toast({ title: "Member removed" });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: string, newRole: TeamRole) => {
    const result = await updateMemberRoleAction(teamId, userId, { role: newRole });
    if (result.success) {
      setMemberList((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
      toast({ title: "Role updated" });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <ul className="divide-y" role="list" aria-label="Team members">
      {memberList.map((member) => {
        const initials = member.user.name
          ? member.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : member.user.email[0]?.toUpperCase() ?? "U";

        const isCurrentUser = member.userId === currentUserId;
        const canModify = isOwner && member.role !== TeamRole.OWNER;

        return (
          <li key={member.userId} className="flex items-center justify-between py-3 px-1">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.user.image ?? undefined} alt={member.user.name ?? ""} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.user.name ?? member.user.email}
                  {isCurrentUser && <span className="text-gray-400 font-normal ml-1">(you)</span>}
                </p>
                <p className="text-xs text-gray-500">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canModify ? (
                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.userId, v as TeamRole)}
                >
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                    <SelectItem value={TeamRole.VIEWER}>Viewer</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[member.role]}`}>
                  {member.role}
                </span>
              )}
              {(canModify || (isCurrentUser && member.role !== TeamRole.OWNER)) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() =>
                    handleRemove(
                      member.userId,
                      member.user.name ?? member.user.email
                    )
                  }
                  aria-label={`Remove ${member.user.name ?? member.user.email} from team`}
                >
                  <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
