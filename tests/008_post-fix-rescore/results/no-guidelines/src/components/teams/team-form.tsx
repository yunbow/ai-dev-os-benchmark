"use client";

import React, { useState, useTransition } from "react";
import { createTeam, updateTeam } from "@/actions/team-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import type { Team } from "@prisma/client";

interface TeamFormProps {
  team?: Pick<Team, "id" | "name" | "description">;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeamForm({ team, onSuccess, onCancel }: TeamFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const isEditing = !!team;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const rawData = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateTeam(team.id, rawData)
        : await createTeam(rawData);

      if (result.success) {
        toast({
          variant: "success",
          title: isEditing ? "Team updated" : "Team created",
          description: result.message,
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
        <Label htmlFor="team-name">
          Team name <span aria-hidden="true">*</span>
        </Label>
        <Input
          id="team-name"
          name="name"
          type="text"
          required
          maxLength={100}
          defaultValue={team?.name}
          placeholder="My Team"
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          aria-invalid={!!fieldErrors.name}
          aria-required="true"
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="team-description">Description</Label>
        <Textarea
          id="team-description"
          name="description"
          maxLength={500}
          defaultValue={team?.description ?? ""}
          placeholder="Describe your team (optional)"
          rows={3}
        />
      </div>

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
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save changes"
          ) : (
            "Create team"
          )}
        </Button>
      </div>
    </form>
  );
}
