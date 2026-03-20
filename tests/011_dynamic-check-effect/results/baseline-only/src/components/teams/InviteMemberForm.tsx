"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/team";
import { inviteMemberAction } from "@/actions/team";
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
import { useToast } from "@/components/ui/use-toast";
import { TeamRole } from "@prisma/client";

interface InviteMemberFormProps {
  teamId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InviteMemberForm({ teamId, onSuccess, onCancel }: InviteMemberFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: TeamRole.MEMBER,
    },
  });

  const onSubmit = async (data: InviteMemberInput) => {
    setIsLoading(true);
    try {
      const result = await inviteMemberAction(teamId, data);
      if (result.success) {
        toast({ title: "Invitation sent", description: `Invitation sent to ${data.email}` });
        reset();
        onSuccess?.();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="invite-email">
          Email Address <span aria-hidden="true" className="text-red-500">*</span>
        </Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="teammate@example.com"
          aria-describedby={errors.email ? "invite-email-error" : undefined}
          aria-required="true"
          {...register("email")}
        />
        {errors.email && (
          <p id="invite-email-error" className="text-sm text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={watch("role")}
          onValueChange={(v) => setValue("role", v as TeamRole)}
        >
          <SelectTrigger id="invite-role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TeamRole.MEMBER}>
              <div>
                <p className="font-medium">Member</p>
                <p className="text-xs text-gray-500">Can create tasks and view all team tasks</p>
              </div>
            </SelectItem>
            <SelectItem value={TeamRole.VIEWER}>
              <div>
                <p className="font-medium">Viewer</p>
                <p className="text-xs text-gray-500">Read-only access</p>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
}
