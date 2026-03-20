"use client";

import { useRouter } from "next/navigation";
import { TeamMemberWithUser, TeamWithMembers, TEAM_ROLE_LABELS } from "../types/team-types";
import { removeMember, updateMemberRole } from "../server/team-actions";
import { InviteMemberForm } from "./invite-member-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { TeamMemberRole } from "@prisma/client";

interface TeamMembersProps {
  team: TeamWithMembers;
  currentUserId: string;
}

export function TeamMembers({ team, currentUserId }: TeamMembersProps) {
  const router = useRouter();
  const currentMember = team.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMember?.role === "OWNER";

  const handleRemoveMember = async (memberId: string) => {
    const result = await removeMember(team.id, memberId);
    if (!result.success) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Member removed" });
    router.refresh();
  };

  const handleRoleChange = async (memberId: string, role: TeamMemberRole) => {
    const result = await updateMemberRole(team.id, memberId, { role });
    if (!result.success) {
      toast({ title: "Error", description: result.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Role updated" });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members ({team.members.length})</h2>
        {(isOwner || currentMember?.role === "MEMBER") && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <InviteMemberForm teamId={team.id} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="divide-y rounded-lg border">
        {team.members.map((member) => {
          const initials = member.user.name
            ? member.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : member.user.email[0]?.toUpperCase() ?? "U";

          const isSelf = member.userId === currentUserId;

          return (
            <div key={member.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {member.user.name ?? member.user.email}
                    {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && !isSelf ? (
                  <Select
                    defaultValue={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value as TeamMemberRole)}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {TEAM_ROLE_LABELS[member.role]}
                  </Badge>
                )}

                {(isOwner && !isSelf) || (isSelf && !isOwner) ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                    title={isSelf ? "Leave team" : "Remove member"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
