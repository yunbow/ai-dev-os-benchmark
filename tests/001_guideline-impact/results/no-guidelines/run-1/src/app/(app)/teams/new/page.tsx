"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTeam } from "@/lib/actions/team";
import { toast } from "@/hooks/use-toast";

export default function NewTeamPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createTeam(formData);
      if (result.success && result.data) {
        toast({ title: "Team created!" });
        router.push(`/teams/${(result.data as { id: string }).id}`);
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Team</h1>
      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                name="name"
                maxLength={100}
                required
                aria-required="true"
                placeholder="My Team"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating..." : "Create Team"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
