"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { createTeamAction } from "@/actions/teams";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createTeamAction(formData);
      if (!result.success) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Team created" });
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          New Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input id="team-name" name="name" required maxLength={100} />
            {fieldErrors.name?.[0] && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-desc">Description</Label>
            <Input id="team-desc" name="description" maxLength={500} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
