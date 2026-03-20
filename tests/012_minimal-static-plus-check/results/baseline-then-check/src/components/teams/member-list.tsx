"use client";

import React, { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeMember, updateMemberRole } from "@/lib/actions/teams";
import { toast } from "@/hooks/use-toast";
import { MoreVertical, UserMinus, Shield } from "lucide-react";

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface MemberListProps {
  members: Member[];
  teamId: string;
  currentUserId: string;
  currentUserRole: string;
}

const roleConfig = {
  OWNER: { label: "Owner", className: "bg-purple-100 text-purple-700" },
  MEMBER: { label: "Member", className: "bg-blue-100 text-blue-700" },
  VIEWER: { label: "Viewer", className: "bg-gray-100 text-gray-600" },
};

export function MemberList({
  members,
  teamId,
  currentUserId,
  currentUserRole,
}: MemberListProps) {
  const [isPending, startTransition] = useTransition();
  const isOwner = currentUserRole === "OWNER";

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await removeMember(teamId, userId);
      if (result.success) {
        toast({ title: "Member removed" });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: "MEMBER" | "VIEWER") => {
    startTransition(async () => {
      const result = await updateMemberRole({ teamId, userId, role: newRole });
      if (result.success) {
        toast({ title: "Role updated" });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <ul className="space-y-3" role="list" aria-label="Team members">
      {members.map((member) => {
        const role = member.role as keyof typeof roleConfig;
        const isSelf = member.user.id === currentUserId;

        return (
          <li
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {member.user.name?.[0]?.toUpperCase() ||
                    member.user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {member.user.name || member.user.email}
                  {isSelf && (
                    <span className="ml-1 text-muted-foreground text-xs">(you)</span>
                  )}
                </p>
                {member.user.name && (
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={roleConfig[role]?.className}>
                {roleConfig[role]?.label}
              </Badge>

              {(isOwner || isSelf) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isPending}
                      aria-label={`Options for ${member.user.name || member.user.email}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && !isSelf && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.user.id, "MEMBER")}
                          disabled={member.role === "MEMBER"}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Set as Member
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.user.id, "VIEWER")}
                          disabled={member.role === "VIEWER"}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Set as Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleRemove(member.user.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      {isSelf ? "Leave team" : "Remove member"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
