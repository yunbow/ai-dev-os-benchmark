"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteTeamMember } from "@/features/team/server/team-actions";
import { toast } from "@/hooks/useToast";
import { TeamRole } from "@prisma/client";
import { Loader2, UserPlus } from "lucide-react";

interface TeamInviteFormProps {
  teamId: string;
  onSuccess?: () => void;
}

export function TeamInviteForm({ teamId, onSuccess }: TeamInviteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>(TeamRole.MEMBER);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleInviteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    const result = await inviteTeamMember(teamId, { email, role });

    if (result.success) {
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
        variant: "default",
      });
      setEmail("");
      setRole(TeamRole.MEMBER);
      onSuccess?.();
    } else {
      if (result.error.fieldErrors) {
        setFieldErrors(result.error.fieldErrors);
      }
      toast({ title: result.error.message, variant: "destructive" });
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleInviteSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-describedby={fieldErrors.email ? "invite-email-error" : undefined}
        />
        {fieldErrors.email && (
          <p id="invite-email-error" className="text-sm text-destructive">
            {fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as TeamRole)}
        >
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TeamRole.MEMBER}>
              Member - Can create and manage their own tasks
            </SelectItem>
            <SelectItem value={TeamRole.VIEWER}>
              Viewer - Read-only access
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending invitation...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Send invitation
          </>
        )}
      </Button>
    </form>
  );
}
