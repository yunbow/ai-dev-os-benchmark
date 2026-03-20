"use client";

import { useState } from "react";
import { User, Crown, Shield, Eye, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeMember, updateMemberRole } from "../server/team-actions";
import { toast } from "@/hooks/use-toast";
import type { TeamMemberWithUser } from "../server/team-actions";
import type { TeamRole } from "@prisma/client";

const roleConfig = {
  OWNER: { label: "Owner", icon: Crown, badge: "default" as const },
  MEMBER: { label: "Member", icon: Shield, badge: "secondary" as const },
  VIEWER: { label: "Viewer", icon: Eye, badge: "outline" as const },
};

interface MemberListProps {
  teamId: string;
  members: TeamMemberWithUser[];
  currentUserId: string;
  currentUserRole: TeamRole;
}

export function MemberList({
  teamId,
  members,
  currentUserId,
  currentUserRole,
}: MemberListProps) {
  const [localMembers, setLocalMembers] = useState(members);

  const handleRemove = async (userId: string, userName: string) => {
    const result = await removeMember(teamId, userId);
    if (!result.success) {
      toast({ title: "Failed to remove member", description: result.error.message, variant: "destructive" });
      return;
    }
    setLocalMembers((prev) => prev.filter((m) => m.userId !== userId));
    toast({ title: `${userName} has been removed from the team.` });
  };

  const handleRoleChange = async (userId: string, role: TeamRole) => {
    const result = await updateMemberRole(teamId, userId, { role });
    if (!result.success) {
      toast({ title: "Failed to update role", description: result.error.message, variant: "destructive" });
      return;
    }
    setLocalMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m))
    );
    toast({ title: "Role updated" });
  };

  const isOwner = currentUserRole === "OWNER";

  return (
    <div className="space-y-2">
      {localMembers.map((member) => {
        const roleInfo = roleConfig[member.role];
        const RoleIcon = roleInfo.icon;
        const isCurrentUser = member.userId === currentUserId;
        const canManage = isOwner && !isCurrentUser;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 shrink-0">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.user.name ?? member.user.email}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-gray-400">(you)</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{member.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={roleInfo.badge} className="gap-1">
                <RoleIcon className="h-3 w-3" />
                {roleInfo.label}
              </Badge>

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7">
                      Manage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Change role</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.userId, "OWNER")}
                      disabled={member.role === "OWNER"}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Owner
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.userId, "MEMBER")}
                      disabled={member.role === "MEMBER"}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Member
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.userId, "VIEWER")}
                      disabled={member.role === "VIEWER"}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Viewer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        handleRemove(
                          member.userId,
                          member.user.name ?? member.user.email
                        )
                      }
                      className="text-red-600 focus:text-red-600"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove from team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isCurrentUser && member.role !== "OWNER" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-red-500 hover:text-red-700"
                  onClick={() => handleRemove(member.userId, "You")}
                >
                  Leave
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
