"use client";

import { useState } from "react";
import { removeMemberAction, updateMemberRoleAction } from "@/features/teams/server/team-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { TeamRole } from "@prisma/client";
import { Trash2 } from "lucide-react";

type Member = {
  id: string;
  role: TeamRole;
  user: { id: string; name: string | null; email: string; image: string | null };
};

interface TeamMemberListProps {
  teamId: string;
  members: Member[];
  currentUserId: string;
  currentUserRole: TeamRole;
  onChanged: () => void;
}

export function TeamMemberList({ teamId, members, currentUserId, currentUserRole, onChanged }: TeamMemberListProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const canManage = currentUserRole === "OWNER";

  const handleRoleChange = async (userId: string, role: TeamRole) => {
    setUpdatingId(userId);
    const result = await updateMemberRoleAction({ teamId, userId, role });
    if (result.success) {
      toast({ title: "Role updated" });
      onChanged();
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const handleRemove = async (userId: string) => {
    const result = await removeMemberAction(teamId, userId);
    if (result.success) {
      toast({ title: "Member removed" });
      onChanged();
    } else {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const initials = member.user.name
          ? member.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
          : member.user.email[0].toUpperCase();
        const isCurrentUser = member.user.id === currentUserId;

        return (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-md border">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.user.name ?? member.user.email}</p>
                {member.user.name && <p className="text-xs text-muted-foreground">{member.user.email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canManage && !isCurrentUser ? (
                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.user.id, v as TeamRole)}
                  disabled={updatingId === member.user.id}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={member.role === "OWNER" ? "default" : "secondary"} className="text-xs">
                  {member.role}
                </Badge>
              )}
              {canManage && !isCurrentUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(member.user.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
