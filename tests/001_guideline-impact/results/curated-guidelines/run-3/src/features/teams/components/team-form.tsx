"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/common/error-message";
import { TeamSchema, type TeamInput } from "../schema/team-schema";
import { createTeam } from "../server/team-actions";
import type { Team } from "@prisma/client";

interface TeamFormProps {
  onSuccess: (team: Team) => void;
  onCancel: () => void;
}

export function TeamForm({ onSuccess, onCancel }: TeamFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamInput>({
    resolver: zodResolver(TeamSchema),
  });

  const onSubmit = async (data: TeamInput) => {
    setServerError(null);
    try {
      const result = await createTeam(data);

      if (!result.success) {
        setServerError(result.error.message);
        return;
      }

      onSuccess(result.data);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ErrorMessage message={serverError} />

      <div className="space-y-2">
        <Label htmlFor="name">Team Name *</Label>
        <Input
          id="name"
          placeholder="e.g. Engineering, Marketing"
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name.message}</p>
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
              Creating...
            </>
          ) : (
            "Create team"
          )}
        </Button>
      </div>
    </form>
  );
}
