"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { inviteMember } from "@/lib/actions/team";

interface InviteMemberFormProps {
  teamId: string;
}

export function InviteMemberForm({ teamId }: InviteMemberFormProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await inviteMember(teamId, formData);
      if (result.success) {
        toast({ title: "Invitation sent!" });
        (e.target as HTMLFormElement).reset();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          aria-required="true"
          placeholder="colleague@example.com"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue="MEMBER">
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="VIEWER">Viewer (read-only)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send Invitation"}
      </Button>
    </form>
  );
}
