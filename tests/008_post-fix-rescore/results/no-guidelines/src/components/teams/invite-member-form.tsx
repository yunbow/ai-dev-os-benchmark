"use client";

import React, { useState, useTransition } from "react";
import { inviteTeamMember } from "@/actions/team-actions";
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
import { toast } from "@/components/ui/toast";
import { Loader2, Mail } from "lucide-react";

interface InviteMemberFormProps {
  teamId: string;
  isOwner: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InviteMemberForm({
  teamId,
  isOwner,
  onSuccess,
  onCancel,
}: InviteMemberFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [role, setRole] = useState("MEMBER");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const rawData = {
      email: formData.get("email") as string,
      role,
    };

    startTransition(async () => {
      const result = await inviteTeamMember(teamId, rawData);

      if (result.success) {
        toast({
          variant: "success",
          title: "Invitation sent",
          description: `An invitation email has been sent to ${rawData.email}.`,
        });
        onSuccess?.();
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="invite-email">
          Email address <span aria-hidden="true">*</span>
        </Label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="colleague@example.com"
            className="pl-9"
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            aria-invalid={!!fieldErrors.email}
            aria-required="true"
          />
        </div>
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.email[0]}
          </p>
        )}
      </div>

      {isOwner && (
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger
              id="invite-role"
              aria-label="Select member role"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">
                <div>
                  <div className="font-medium">Member</div>
                  <div className="text-xs text-muted-foreground">
                    Can create and edit their own tasks, view all team tasks
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="VIEWER">
                <div>
                  <div className="font-medium">Viewer</div>
                  <div className="text-xs text-muted-foreground">
                    Read-only access to all team content
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send invitation"
          )}
        </Button>
      </div>
    </form>
  );
}
