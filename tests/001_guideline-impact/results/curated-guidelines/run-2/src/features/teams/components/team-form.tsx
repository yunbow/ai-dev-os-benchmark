"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CreateTeamSchema, CreateTeamInput } from "../schema/team-schema";
import { createTeam, updateTeam } from "../server/team-actions";
import { TeamWithMembers } from "../types/team-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface TeamFormProps {
  team?: TeamWithMembers;
  onSuccess?: () => void;
}

export function TeamForm({ team, onSuccess }: TeamFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!team;

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: { name: team?.name ?? "" },
  });

  const onSubmit = async (data: CreateTeamInput) => {
    setIsLoading(true);

    if (isEditing && team) {
      const result = await updateTeam(team.id, data);
      if (!result.success) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      toast({ title: "Success", description: "Team updated" });
    } else {
      const result = await createTeam(data);
      if (!result.success) {
        toast({ title: "Error", description: result.error.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      toast({ title: "Success", description: "Team created" });
      if (result.success) {
        router.push(`/teams/${result.data.id}`);
      }
    }

    router.refresh();
    onSuccess?.();
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="My Team" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          {isEditing ? "Update Team" : "Create Team"}
        </Button>
      </form>
    </Form>
  );
}
