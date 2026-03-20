"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/team";
import { inviteTeamMember } from "@/lib/actions/teams";
import { TeamRole } from "@prisma/client";

interface InviteFormProps {
  teamId: string;
}

export function InviteForm({ teamId }: InviteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { role: TeamRole.MEMBER },
  });

  const onSubmit = async (data: InviteMemberInput) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("role", data.role);

      const result = await inviteTeamMember(teamId, formData);

      if (result.success) {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${data.email}`,
        });
        reset({ role: TeamRole.MEMBER });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="colleague@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          defaultValue={TeamRole.MEMBER}
          onValueChange={(v) => setValue("role", v as TeamRole)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TeamRole.VIEWER}>Viewer (read-only)</SelectItem>
            <SelectItem value={TeamRole.MEMBER}>Member (can create tasks)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Invitation"}
      </Button>
    </form>
  );
}
