"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TeamRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteTeamMember } from "@/actions/team";
import { useToast } from "@/hooks/use-toast";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/team";

interface InviteFormProps {
  teamId: string;
  onSuccess?: () => void;
}

export function InviteForm({ teamId, onSuccess }: InviteFormProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { role: TeamRole.MEMBER },
  });

  async function handleInviteSubmit(data: InviteMemberInput) {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("role", data.role);

    const result = await inviteTeamMember(teamId, formData);

    if (result.success) {
      toast({ title: "Invitation sent" });
      reset();
      onSuccess?.();
    } else {
      toast({ variant: "destructive", title: "Failed to send invitation", description: result.error });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleInviteSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <Label htmlFor="invite-email">Email address <span aria-hidden="true">*</span></Label>
        <Input
          id="invite-email"
          type="email"
          aria-required="true"
          aria-describedby={errors.email ? "invite-email-error" : undefined}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p id="invite-email-error" className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          defaultValue={TeamRole.MEMBER}
          onValueChange={(val) => setValue("role", val as TeamRole)}
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

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending..." : "Send Invitation"}
      </Button>
    </form>
  );
}
