"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
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
import { ErrorMessage } from "@/components/common/error-message";
import { InviteSchema, type InviteInput } from "../schema/team-schema";
import { inviteMember } from "../server/team-actions";

interface InviteFormProps {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InviteForm({ teamId, onSuccess, onCancel }: InviteFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { role: "MEMBER" },
  });

  const role = watch("role");

  const onSubmit = async (data: InviteInput) => {
    setServerError(null);
    try {
      const result = await inviteMember(teamId, data);

      if (!result.success) {
        setServerError(result.error.message);
        return;
      }

      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-sm text-gray-700">Invitation sent successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ErrorMessage message={serverError} />

      <div className="space-y-2">
        <Label htmlFor="email">Email address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="colleague@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          value={role}
          onValueChange={(v) => setValue("role", v as InviteInput["role"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member — can create and edit tasks</SelectItem>
            <SelectItem value="VIEWER">Viewer — read-only access</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-xs text-red-600">{errors.role.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending invitation...
            </>
          ) : (
            "Send invitation"
          )}
        </Button>
      </div>
    </form>
  );
}
