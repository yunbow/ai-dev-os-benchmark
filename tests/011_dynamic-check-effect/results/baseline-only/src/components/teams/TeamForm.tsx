"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTeamSchema, type CreateTeamInput } from "@/lib/validations/team";
import { createTeamAction, updateTeamAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type { TeamWithMembers } from "@/types";

interface TeamFormProps {
  team?: TeamWithMembers;
  onSuccess?: (team: TeamWithMembers) => void;
  onCancel?: () => void;
}

export function TeamForm({ team, onSuccess, onCancel }: TeamFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!team;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: team?.name ?? "",
      description: team?.description ?? "",
    },
  });

  const onSubmit = async (data: CreateTeamInput) => {
    setIsLoading(true);
    try {
      if (isEditing && team) {
        const result = await updateTeamAction(team.id, data);
        if (result.success) {
          toast({ title: "Team updated" });
          onSuccess?.(result.data);
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      } else {
        const result = await createTeamAction(data);
        if (result.success) {
          toast({ title: "Team created" });
          if (onSuccess) {
            onSuccess(result.data);
          } else {
            router.push(`/teams/${result.data.id}`);
          }
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">
              Team Name <span aria-hidden="true" className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="My Team"
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-required="true"
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this team work on?"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Team"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
