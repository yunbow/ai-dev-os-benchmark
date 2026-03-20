"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteTeamMemberAction } from "../server/team-actions";
import { inviteMemberSchema, InviteMemberInput } from "../schema/team-schema";
import { TeamRole } from "@prisma/client";

export function InviteMemberButton({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: TeamRole.MEMBER },
  });

  function onSubmit(values: InviteMemberInput) {
    startTransition(async () => {
      const result = await inviteTeamMemberAction(teamId, values);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Invitation sent");
      setOpen(false);
      form.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <UserPlus className="mr-2 h-4 w-4" aria-hidden />
        Invite Member
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address *</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              {...form.register("email")}
              aria-describedby={form.formState.errors.email ? "invite-email-error" : undefined}
            />
            {form.formState.errors.email && (
              <p id="invite-email-error" className="text-sm text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              defaultValue={TeamRole.MEMBER}
              onValueChange={(v) => form.setValue("role", v as TeamRole)}
              disabled={isPending}
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                <SelectItem value={TeamRole.VIEWER}>Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
