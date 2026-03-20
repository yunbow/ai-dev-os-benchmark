"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createTeamSchema, type CreateTeamInput } from "@/lib/validations/team";
import { createTeam } from "@/lib/actions/teams";

export function TeamForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
  });

  const onSubmit = async (data: CreateTeamInput) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", data.name);

      const result = await createTeam(formData);

      if (result.success) {
        toast({ title: "Team created" });
        reset();
        router.push(`/teams/${result.data.id}`);
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
        <Label htmlFor="name">Team Name *</Label>
        <Input
          id="name"
          placeholder="My Team"
          maxLength={100}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Team"}
      </Button>
    </form>
  );
}
